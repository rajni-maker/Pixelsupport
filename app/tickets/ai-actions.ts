"use server";

import { createClient } from "@/lib/supabase/server";
import { draftReplyText } from "@/lib/anthropic";

// Called by the "Draft with AI" button. Loads the ticket + thread and asks
// Claude for a suggested reply. Returns text the agent edits before sending.
export async function draftReply(
  ticketId: string,
): Promise<{ draft?: string; error?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "AI isn't configured yet (missing API key)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: ticket } = await supabase
    .from("tickets")
    .select("subject, description")
    .eq("id", ticketId)
    .single();
  if (!ticket) return { error: "Ticket not found." };

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("sender_role, body")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  try {
    const draft = await draftReplyText(
      ticket.subject,
      ticket.description ?? "",
      messages ?? [],
    );
    return { draft };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "AI request failed.",
    };
  }
}
