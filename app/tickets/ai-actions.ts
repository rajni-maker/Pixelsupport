"use server";

import { createClient } from "@/lib/supabase/server";
import { draftReplyText } from "@/lib/ai";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/tickets";

// Called by the "Draft with AI" button. Loads the ticket + thread and asks the
// AI model for a suggested reply. Returns text the agent edits before sending.
export async function draftReply(
  ticketId: string,
): Promise<{ draft?: string; error?: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { error: "AI isn't configured yet (missing API key)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // The voice of the draft follows the CALLER'S role, resolved from the session
  // here on the server — never from anything the browser sends.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("subject, description, priority, status, companies(name)")
    .eq("id", ticketId)
    .single();
  if (!ticket) return { error: "Ticket not found." };

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("sender_role, body")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  try {
    const draft = await draftReplyText({
      viewerRole: profile?.role,
      subject: ticket.subject,
      description: ticket.description ?? "",
      priority: ticket.priority
        ? PRIORITY_LABELS[ticket.priority as TicketPriority]
        : null,
      status: ticket.status
        ? STATUS_LABELS[ticket.status as TicketStatus]
        : null,
      companyName:
        (ticket.companies as { name?: string } | null)?.name ?? null,
      messages: messages ?? [],
    });
    return { draft };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "AI request failed.",
    };
  }
}
