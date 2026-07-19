import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import ReplyForm from "./ReplyForm";
import StatusControl from "./StatusControl";
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

  // Load the ticket, the current user's role, and the message thread together.
  // RLS ensures a user can only load a ticket they're allowed to see.
  const [{ data: ticket }, { data: profile }, { data: messages }] =
    await Promise.all([
      supabase
        .from("tickets")
        .select(
          "id, subject, description, status, priority, created_at, ai_summary, category, ai_suggested_tags",
        )
        .eq("id", id)
        .single(),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("ticket_messages")
        .select("id, body, sender_role, created_at")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (!ticket) notFound();

  const canChangeStatus =
    profile?.role === "admin" || profile?.role === "agent";

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

        {/* Status control — only for admins/agents */}
        {canChangeStatus && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-gray-200">
            <span className="text-sm font-medium text-gray-700">
              Change status:
            </span>
            <StatusControl
              ticketId={ticket.id}
              current={ticket.status as TicketStatus}
            />
          </div>
        )}

        {/* AI summary panel — shown once triage has run on this ticket */}
        {ticket.ai_summary && (
          <div className="mt-6 rounded-2xl bg-indigo-50 p-5 ring-1 ring-indigo-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-indigo-900">
                ✨ AI summary
              </span>
              {ticket.category && (
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
                  {ticket.category}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-indigo-900">{ticket.ai_summary}</p>
            {ticket.ai_suggested_tags &&
              ticket.ai_suggested_tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ticket.ai_suggested_tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white px-2 py-0.5 text-xs text-indigo-600 ring-1 ring-inset ring-indigo-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Original ticket description */}
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

        {/* Message thread */}
        <h2 className="mt-8 text-sm font-semibold text-gray-900">
          Conversation
        </h2>
        {messages && messages.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className="rounded-xl bg-white p-4 ring-1 ring-gray-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium capitalize text-gray-700">
                    {m.sender_role ?? "user"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(m.created_at)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {m.body}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-gray-400">No replies yet.</p>
        )}

        {/* Reply box */}
        <ReplyForm ticketId={ticket.id} />
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
