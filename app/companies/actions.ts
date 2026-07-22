"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { isInternal } from "@/lib/roles";
import { notifyNewMember } from "@/lib/email";

export type CompanyState = { error: string } | { success: string } | null;

// Verify the caller is signed in and internal staff; return their org id.
type Gate =
  | { ok: true; organizationId: string }
  | { ok: false; error: string };

async function requireInternal(): Promise<Gate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!me || !isInternal(me.role)) {
    return { ok: false, error: "Only agency staff can manage client companies." };
  }
  return { ok: true, organizationId: me.organization_id };
}

// Add a new client company (e.g. RDT) to the agency.
export async function createCompany(
  _prev: CompanyState,
  formData: FormData,
): Promise<CompanyState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Company name is required." };

  const gate = await requireInternal();
  if (!gate.ok) return { error: gate.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .insert({ organization_id: gate.organizationId, name });

  if (error) return { error: error.message };

  revalidatePath("/companies");
  return { success: `Added ${name}.` };
}

// Invite a Company Contact to a specific client company. Creates the auth user
// with a temporary password; the DB trigger places them in the company as a
// company_contact based on the metadata we pass.
export async function inviteContact(
  _prev: CompanyState,
  formData: FormData,
): Promise<CompanyState> {
  const companyId = String(formData.get("companyId") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!companyId) return { error: "Missing company." };
  if (!email || !password) {
    return { error: "Email and temporary password are required." };
  }
  if (password.length < 6) {
    return { error: "Temporary password must be at least 6 characters." };
  }

  const gate = await requireInternal();
  if (!gate.ok) return { error: gate.error };

  // Make sure the company belongs to the caller's agency (RLS-scoped read).
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("id, name, organization_id")
    .eq("id", companyId)
    .single();

  if (!company || company.organization_id !== gate.organizationId) {
    return { error: "Company not found." };
  }

  const admin = createAdmin();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      organization_id: gate.organizationId,
      role: "company_contact",
      company_id: companyId,
    },
  });

  if (error) return { error: error.message };

  // Alert the org's admins that a new contact joined (best-effort).
  const { data: admins } = await supabase
    .from("profiles")
    .select("email")
    .eq("role", "organization_admin");
  await notifyNewMember({
    to: (admins ?? []).map((a) => a.email as string).filter(Boolean),
    memberLabel: fullName || email,
    roleText: "Company Contact",
    companyName: company.name,
    path: `/companies/${companyId}`,
  });

  revalidatePath(`/companies/${companyId}`);
  return {
    success: `${email} added to ${company.name}. Share their temporary password so they can log in.`,
  };
}
