import { createClient } from "@supabase/supabase-js";

// Admin Supabase client — uses the SERVICE ROLE key, which bypasses Row Level
// Security and can manage auth users. SERVER-ONLY: never import this into a
// Client Component, and never expose the service role key to the browser.
export function createAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
