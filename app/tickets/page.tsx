import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  formatDateTime,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/tickets";

export default async function TicketsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS scopes this to the user's company (and, for clients, their own tickets).
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, subject, status, priority, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>
          <Link
            href="/tickets/new"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + New ticket
          </Link>
        </div>

        {!tickets || tickets.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-sm text-gray-500">No tickets yet.</p>
            <Link
              href="/tickets/new"
              className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Create your first ticket
            </Link>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-gray-200 overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tickets/${t.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {t.subject}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDateTime(t.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      text={PRIORITY_LABELS[t.priority as TicketPriority]}
                      className={PRIORITY_STYLES[t.priority as TicketPriority]}
                    />
                    <Badge
                      text={STATUS_LABELS[t.status as TicketStatus]}
                      className={STATUS_STYLES[t.status as TicketStatus]}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {text}
    </span>
  );
}
