import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS ensures a user can only load a ticket they're allowed to see.
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, subject, description, status, priority, created_at")
    .eq("id", id)
    .single();

  if (!ticket) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/tickets" className="text-sm text-gray-500 hover:underline">
          ← Back to tickets
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            {ticket.subject}
          </h1>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <Badge
              text={PRIORITY_LABELS[ticket.priority as TicketPriority]}
              className={PRIORITY_STYLES[ticket.priority as TicketPriority]}
            />
            <Badge
              text={STATUS_LABELS[ticket.status as TicketStatus]}
              className={STATUS_STYLES[ticket.status as TicketStatus]}
            />
          </div>
        </div>

        <p className="mt-1 text-xs text-gray-400">
          Opened {formatDateTime(ticket.created_at)}
        </p>

        <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-gray-200">
          {ticket.description ? (
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {ticket.description}
            </p>
          ) : (
            <p className="text-sm italic text-gray-400">
              No description provided.
            </p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            Replies and status changes are coming next.
          </p>
        </div>
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
