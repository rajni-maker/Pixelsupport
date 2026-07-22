"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { isInternal } from "@/lib/roles";
import { notifyNewMember } from "@/lib/email";

// Shape of what these actions return to the form when something goes wrong.
export type TeamState = { error: string } | { success: string } | null;

// Add a Support Rep (internal staff) to the agency. Creates the auth user with
// a temporary password (share it manually for now; email invites come later).
// Client Contacts are invited separately, from a company's page.
export async function createTeamMember(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and temporary password are required." };
  }
  if (password.length < 6) {
    return { error: "Temporary password must be at least 6 characters." };
  }

  // Verify the current user is internal staff, and get their agency id.
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
    return { error: "Only agency staff can add team members." };
  }

  // Create the user via the admin API. The DB trigger reads organization_id +
  // role from metadata and places them in this agency as a support rep.
  const admin = createAdmin();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      organization_id: me.organization_id,
      role: "support_rep",
    },
  });

  if (error) return { error: error.message };

  // Alert the org's admins that a new member joined (best-effort).
  const { data: admins } = await supabase
    .from("profiles")
    .select("email")
    .eq("role", "organization_admin");
  await notifyNewMember({
    to: (admins ?? []).map((a) => a.email as string).filter(Boolean),
    memberLabel: fullName || email,
    roleText: "Support Rep",
    path: "/team",
  });

  revalidatePath("/team");
  return {
    success: `${email} added as a Support Rep. Share their temporary password so they can log in.`,
  };
}
