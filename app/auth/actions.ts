"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Shape of what these actions return to the form when something goes wrong.
export type AuthState = { error: string } | null;

// Sign up a brand-new user. The database trigger we installed automatically
// creates their organization and marks them as the "admin". We pass the
// full name + org name along as metadata so the trigger can use them.
export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const orgName = String(formData.get("orgName") ?? "").trim();

  if (!email || !password || !orgName) {
    return { error: "Organization name, email, and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, org_name: orgName } },
  });

  if (error) return { error: error.message };

  // Success — send them to their dashboard.
  redirect("/dashboard");
}

// Log an existing user in.
export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

// Log the current user out.
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
