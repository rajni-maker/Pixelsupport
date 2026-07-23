import { createClient } from "@/lib/supabase/server";
import LandingPage from "@/components/landing/LandingPage";

export default async function Home() {
  // The landing page is always shown, signed in or not — being logged in just
  // swaps the nav CTA from "Log In" to "Go to Dashboard".
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The marketing page is a client component (scroll-driven animations), so it
  // lives on its own and this server component only resolves the session.
  return <LandingPage loggedIn={Boolean(user)} />;
}
