import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPage from "@/components/landing/LandingPage";

export default async function Home() {
  // If already logged in, skip the landing page and go to the dashboard.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  // The marketing page is a client component (scroll-driven animations), so it
  // lives on its own and this server component only does the auth check.
  return <LandingPage />;
}
