"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { triageTicket } from "@/lib/anthropic";
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/tickets";

export type TicketFormState = { error: string } | null;

// Create a new ticket for the logged-in user's company.
export async function createTicket(
  _prev: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const subject = String(formData.get("subject") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium") as TicketPriority;

  if (!subject) return { error: "Subject is required." };
  if (!PRIORITY_OPTIONS.includes(priority)) {
    return { error: "Please choose a valid priority." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Look up the user's company so we can stamp it on the ticket. RLS also
  // enforces this, but we need the value to insert.
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Could not find your profile." };

  const { data: inserted, error } = await supabase
    .from("tickets")
    .insert({
      organization_id: profile.organization_id,
      client_id: user.id,
      subject,
      description: description || null,
      priority,
      // status defaults to 'open' in the database
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // AI triage (best-effort): summarize + suggest a category/tags. If the AI
  // call fails or no key is set, the ticket is already created — we just skip.
  if (inserted && process.env.ANTHROPIC_API_KEY) {
    try {
      const t = await triageTicket(subject, description);
      await supabase
        .from("tickets")
        .update({
          ai_summary: t.summary,
          category: t.category,
          ai_suggested_tags: t.tags,
        })
        .eq("id", inserted.id);
    } catch {
      // ignore — triage is a nice-to-have, not required to create a ticket
    }
  }

  revalidatePath("/tickets");
  redirect("/tickets");
}

// Add a reply to a ticket's message thread.
export async function addReply(
  _prev: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!ticketId) return { error: "Missing ticket." };
  if (!body) return { error: "Reply can't be empty." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // We record the sender's role on the message so the thread can show who said what.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: user.id,
    sender_role: profile?.role ?? "client",
    body,
  });

  if (error) return { error: error.message };

  revalidatePath(`/tickets/${ticketId}`);
  return null;
}

// Change a ticket's status and record the change in the history log.
// Only admins and agents may change status.
export async function changeStatus(
  _prev: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const ticketId = String(formData.get("ticketId") ?? "");
  const newStatus = String(formData.get("status") ?? "") as TicketStatus;

  if (!ticketId) return { error: "Missing ticket." };
  if (!STATUS_OPTIONS.includes(newStatus)) {
    return { error: "Invalid status." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "agent"].includes(profile.role)) {
    return { error: "Only agents can change ticket status." };
  }

  // Read the current status so we can log the transition.
  const { data: ticket } = await supabase
    .from("tickets")
    .select("status")
    .eq("id", ticketId)
    .single();

  if (!ticket) return { error: "Ticket not found." };
  if (ticket.status === newStatus) return null; // no change

  const { error: updateError } = await supabase
    .from("tickets")
    .update({ status: newStatus })
    .eq("id", ticketId);

  if (updateError) return { error: updateError.message };

  // Log the transition (best-effort — status already changed above).
  await supabase.from("ticket_status_history").insert({
    ticket_id: ticketId,
    old_status: ticket.status,
    new_status: newStatus,
    changed_by: user.id,
  });

  revalidatePath(`/tickets/${ticketId}`);
  return null;
}
