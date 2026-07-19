import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  // If already logged in, skip the landing page and go to the dashboard.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        PixelSupport
      </h1>
      <p className="mt-3 max-w-md text-gray-500">
        A lightweight, AI-assisted helpdesk. Stop babysitting tickets — let AI
        sort and draft, you just approve and send.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/signup"
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
