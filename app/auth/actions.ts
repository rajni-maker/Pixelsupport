"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { notifyNewSignup, notifyLogin } from "@/lib/email";

// Shape of what these actions return to the form when something goes wrong.
export type AuthState = { error: string } | null;

// Reset flows also report a success message.
export type ResetState = { error: string } | { success: string } | null;

// Sign up a brand-new user. The database trigger we installed automatically
// creates their organization (agency) and makes them its Organization Admin.
// We pass the full name + org name along as metadata so the trigger can use them.
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

  // Alert the platform admin that a new agency signed up (best-effort; only
  // fires if ADMIN_ALERT_EMAIL is configured).
  await notifyNewSignup({ orgName, adminEmail: email });

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

  // Alert the platform admin on every successful sign-in (best-effort; only
  // fires if ADMIN_ALERT_EMAIL is configured).
  await notifyLogin({ email });

  redirect("/dashboard");
}

// Log the current user out.
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Step 1 of password recovery: email the user a reset link. The link points at
// our /auth/callback route, which exchanges the code for a session and forwards
// to /reset-password. We always report success so we don't reveal which emails
// are registered.
export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required." };

  // Build an absolute origin that works on both localhost and the deployed URL.
  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  return {
    success:
      "If that email is registered, we've sent a password reset link. Check your inbox.",
  };
}

// Step 2 of password recovery: the user is now on /reset-password with a
// recovery session (set by /auth/callback). Save their new password.
export async function updatePassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Your reset link has expired. Request a new one from the login page.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
