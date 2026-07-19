import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Who is logged in? (getUser is the trusted, server-verified check.)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in -> bounce to the login screen.
  if (!user) redirect("/login");

  // Load this user's profile + their organization name in one query.
  // RLS guarantees we can only read our own org's data.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, email, organizations(company_name)")
    .eq("id", user.id)
    .single();

  const orgName =
    (profile?.organizations as { company_name?: string } | null)?.company_name ??
    "—";

  return (
    <main className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          You&apos;re signed in. Here are your account details.
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Company" value={orgName} />
          <Stat label="Role" value={profile?.role ?? "—"} />
          <Stat label="Email" value={profile?.email ?? user.email ?? "—"} />
        </dl>

        <div className="mt-10 flex items-center justify-between rounded-xl bg-white p-6 ring-1 ring-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-900">Tickets</p>
            <p className="text-sm text-gray-500">
              View and manage your support tickets.
            </p>
          </div>
          <a
            href="/tickets"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Open tickets →
          </a>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium capitalize text-gray-900">
        {value}
      </dd>
    </div>
  );
}
