import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  STATUS_OPTIONS,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  PRIORITY_OPTIONS,
  formatDateTime,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/tickets";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const { status, priority } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only treat a filter as active if it's a valid value (ignore junk in the URL).
  const activeStatus = STATUS_OPTIONS.includes(status as TicketStatus)
    ? (status as TicketStatus)
    : null;
  const activePriority = PRIORITY_OPTIONS.includes(priority as TicketPriority)
    ? (priority as TicketPriority)
    : null;

  // RLS scopes this to the user's company (and, for clients, their own tickets).
  let query = supabase
    .from("tickets")
    .select("id, subject, status, priority, created_at")
    .order("created_at", { ascending: false });

  if (activeStatus) query = query.eq("status", activeStatus);
  if (activePriority) query = query.eq("priority", activePriority);

  const { data: tickets } = await query;
  const hasFilter = activeStatus || activePriority;

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

        {/* Filter bar — a plain GET form, so filters live in the URL */}
        <form
          method="GET"
          className="mt-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-gray-200"
        >
          <label className="block">
            <span className="text-xs font-medium text-gray-500">Status</span>
            <select
              name="status"
              defaultValue={activeStatus ?? ""}
              className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500">Priority</span>
            <select
              name="priority"
              defaultValue={activePriority ?? ""}
              className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            >
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Apply
          </button>
          {hasFilter && (
            <Link
              href="/tickets"
              className="px-2 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Clear
            </Link>
          )}
        </form>

        {!tickets || tickets.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-sm text-gray-500">
              {hasFilter
                ? "No tickets match these filters."
                : "No tickets yet."}
            </p>
            {hasFilter ? (
              <Link
                href="/tickets"
                className="mt-4 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Clear filters
              </Link>
            ) : (
              <Link
                href="/tickets/new"
                className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Create your first ticket
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-gray-200 overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
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
