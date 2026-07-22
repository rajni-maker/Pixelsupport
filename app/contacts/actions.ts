"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { notifyNewMember } from "@/lib/email";

export type ContactState = { error: string } | { success: string } | null;

// Verify the caller is a company contact tied to a company; return their org +
// company ids so we can scope the new colleague to exactly the same company.
type Gate =
  | { ok: true; organizationId: string; companyId: string }
  | { ok: false; error: string };

async function requireContact(): Promise<Gate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, organization_id, company_id")
    .eq("id", user.id)
    .single();

  if (!me || me.role !== "company_contact" || !me.company_id) {
    return { ok: false, error: "Only company contacts can add colleagues." };
  }
  return {
    ok: true,
    organizationId: me.organization_id,
    companyId: me.company_id,
  };
}

// Invite a colleague to the caller's own company. The new user is always a
// company_contact in the same company — a contact can't escalate role or
// company.
export async function inviteColleague(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and temporary password are required." };
  }
  if (password.length < 6) {
    return { error: "Temporary password must be at least 6 characters." };
  }

  const gate = await requireContact();
  if (!gate.ok) return { error: gate.error };

  const admin = createAdmin();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      organization_id: gate.organizationId,
      role: "company_contact",
      company_id: gate.companyId,
    },
  });

  if (error) return { error: error.message };

  // Alert the org's admins that a new contact joined (best-effort).
  const supabase = await createClient();
  const [{ data: admins }, { data: company }] = await Promise.all([
    supabase.from("profiles").select("email").eq("role", "organization_admin"),
    supabase.from("companies").select("name").eq("id", gate.companyId).single(),
  ]);
  await notifyNewMember({
    to: (admins ?? []).map((a) => a.email as string).filter(Boolean),
    memberLabel: fullName || email,
    roleText: "Company Contact",
    companyName: company?.name ?? null,
    path: `/companies/${gate.companyId}`,
  });

  revalidatePath("/contacts");
  return {
    success: `${email} added. Share their temporary password so they can log in.`,
  };
}
