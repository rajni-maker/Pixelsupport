"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { triageTicket, acknowledgeReply, classifyReplyIntent } from "@/lib/ai";
import { isInternal, roleLabel, INTERNAL_ROLES } from "@/lib/roles";
import {
  notifyNewTicket,
  notifyTicketReceived,
  notifyNewReply,
  notifyStatusChange,
  notifyAssignment,
} from "@/lib/email";
import {
  slackNewTicket,
  slackTicketAssigned,
  slackCustomerReply,
} from "@/lib/slack";
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  STATUS_LABELS,
  autoStatusOnReply,
  autoStatusOnAssign,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/tickets";

// Emails of the agency's internal staff (org admins + support reps), RLS-scoped
// to the caller's org. Used to alert the team about client activity.
async function internalStaffEmails(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string[]> {
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .in("role", INTERNAL_ROLES);
  return (data ?? []).map((r) => r.email as string).filter(Boolean);
}

export type TicketFormState = { error: string } | null;

// Clear a pending AI status suggestion. Its own helper, and deliberately
// silent about failure: `tickets.ai_suggested_status` arrives in migration
// 0008, and nothing here should break on a database that predates it.
async function clearSuggestedStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ticketId: string,
): Promise<void> {
  await supabase
    .from("tickets")
    .update({ ai_suggested_status: null })
    .eq("id", ticketId);
}

// Create a new ticket for the logged-in user's company.
export async function createTicket(
  _prev: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const subject = String(formData.get("subject") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium") as TicketPriority;
  const formCompanyId = String(formData.get("companyId") ?? "").trim();

  if (!subject) return { error: "Subject is required." };
  if (!PRIORITY_OPTIONS.includes(priority)) {
    return { error: "Please choose a valid priority." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Look up the user's org, role, and company so we can stamp the ticket.
  // RLS also enforces this, but we need the values to insert.
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Could not find your profile." };

  // Which client Company does this ticket belong to?
  //  - A Company Contact's tickets are always their own company (chosen for them).
  //  - Internal staff (admin/rep) create on behalf of a client, so they pick one.
  const companyId = isInternal(profile.role)
    ? formCompanyId || null
    : profile.company_id;

  if (isInternal(profile.role) && !companyId) {
    return { error: "Please choose which client company this ticket is for." };
  }

  const { data: inserted, error } = await supabase
    .from("tickets")
    .insert({
      organization_id: profile.organization_id,
      client_id: user.id,
      company_id: companyId,
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
  if (inserted && process.env.OPENAI_API_KEY) {
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

  // Immediate acknowledgment (the automatic FIRST reply) — only for tickets a
  // client contact opened; an internal rep opening a ticket already IS support.
  // Subsequent replies are human (optionally "Draft with AI").
  if (inserted && !isInternal(profile.role)) {
    const FALLBACK =
      "Thanks for reaching out — we've received your ticket. Our support representative will respond within 24 hours.";
    let ackBody = FALLBACK;
    if (process.env.OPENAI_API_KEY) {
      try {
        ackBody = (await acknowledgeReply(subject, description)) || FALLBACK;
      } catch {
        ackBody = FALLBACK; // AI failed — still send the standard acknowledgment
      }
    }
    await supabase.from("ticket_messages").insert({
      ticket_id: inserted.id,
      sender_id: null, // automated — not from a specific user
      sender_role: "support_rep",
      body: ackBody,
      is_ai_drafted: true,
    });
  }

  // Email notifications (best-effort): alert internal staff, and confirm to the
  // creator if they're a client contact.
  if (inserted) {
    let companyName: string | null = null;
    if (companyId) {
      const { data: co } = await supabase
        .from("companies")
        .select("name")
        .eq("id", companyId)
        .single();
      companyName = co?.name ?? null;
    }
    const staff = await internalStaffEmails(supabase);
    await notifyNewTicket({
      to: staff.filter((e) => e !== user.email),
      ticketId: inserted.id,
      subject,
      companyName,
    });
    if (!isInternal(profile.role) && user.email) {
      await notifyTicketReceived({
        to: [user.email],
        ticketId: inserted.id,
        subject,
      });
    }

    // Slack: post to the team channel (no-op when SLACK_WEBHOOK_URL is unset).
    const { data: creator } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();
    await slackNewTicket({
      ticketId: inserted.id,
      subject,
      companyName,
      priority,
      createdBy: creator?.full_name || creator?.email || user.email || "Unknown",
    });
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
    sender_role: profile?.role ?? "company_contact",
    body,
  });

  if (error) return { error: error.message };

  // Email the other party (best-effort). Internal reply -> the client contact;
  // client reply -> the agency's internal staff.
  const { data: ticket } = await supabase
    .from("tickets")
    .select("subject, status, client_id, companies(name)")
    .eq("id", ticketId)
    .single();

  // --- Automatic status movement -----------------------------------------
  // The reply itself tells us where the ticket stands. Low-risk moves apply
  // straight away and are logged like any other transition; "looks resolved"
  // is only ever *suggested*, because closing a customer's issue on their
  // behalf is a judgement a person should make. Best-effort throughout — the
  // reply is already saved, and none of this is worth failing it over.
  if (ticket) {
    const senderIsInternal = isInternal(profile?.role);
    const current = ticket.status as TicketStatus;
    const auto = autoStatusOnReply(current, senderIsInternal);

    if (auto) {
      const { error: moveError } = await supabase
        .from("tickets")
        .update({ status: auto })
        .eq("id", ticketId);
      if (!moveError) {
        await clearSuggestedStatus(supabase, ticketId);
        await supabase.from("ticket_status_history").insert({
          ticket_id: ticketId,
          old_status: current,
          new_status: auto,
          changed_by: user.id,
        });
      }
    }

    // Only a client's own words can suggest their issue is fixed, and only
    // while the ticket is still open for work.
    if (
      !senderIsInternal &&
      current !== "resolved" &&
      current !== "closed" &&
      process.env.OPENAI_API_KEY
    ) {
      const intent = await classifyReplyIntent(ticket.subject, body);
      if (intent === "confirms_resolved") {
        await supabase
          .from("tickets")
          .update({ ai_suggested_status: "resolved" })
          .eq("id", ticketId);
      }
    }
  }

  if (ticket) {
    if (isInternal(profile?.role)) {
      const { data: creator } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", ticket.client_id)
        .single();
      if (creator?.email) {
        await notifyNewReply({
          to: [creator.email],
          ticketId,
          subject: ticket.subject,
          fromLabel: "the support team",
        });
      }
    } else {
      const staff = await internalStaffEmails(supabase);
      await notifyNewReply({
        to: staff.filter((e) => e !== user.email),
        ticketId,
        subject: ticket.subject,
        fromLabel: roleLabel(profile?.role),
      });

      // Slack: only customer replies post to the channel. An internal reply is
      // the team's own outgoing message, so it stays in email.
      const { data: sender } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();
      await slackCustomerReply({
        ticketId,
        subject: ticket.subject,
        fromName: sender?.full_name || sender?.email || user.email || "Customer",
        companyName: (ticket.companies as { name?: string } | null)?.name ?? null,
        body,
      });
    }
  }

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

  if (!profile || !isInternal(profile.role)) {
    return { error: "Only support reps can change ticket status." };
  }

  // Read the current status so we can log the transition.
  const { data: ticket } = await supabase
    .from("tickets")
    .select("status, subject, client_id")
    .eq("id", ticketId)
    .single();

  if (!ticket) return { error: "Ticket not found." };
  if (ticket.status === newStatus) return null; // no change

  const { error: updateError } = await supabase
    .from("tickets")
    .update({ status: newStatus })
    .eq("id", ticketId);

  if (updateError) return { error: updateError.message };

  // Setting the status answers any pending suggestion, whether or not the rep
  // took the AI's advice. Kept as its own best-effort write so that a database
  // without migration 0008 still changes status normally.
  await clearSuggestedStatus(supabase, ticketId);

  // Log the transition (best-effort — status already changed above).
  await supabase.from("ticket_status_history").insert({
    ticket_id: ticketId,
    old_status: ticket.status,
    new_status: newStatus,
    changed_by: user.id,
  });

  // Email the client contact that their ticket's status changed (best-effort).
  const { data: creator } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", ticket.client_id)
    .single();
  if (creator?.email) {
    await notifyStatusChange({
      to: [creator.email],
      ticketId,
      subject: ticket.subject,
      statusLabel: STATUS_LABELS[newStatus],
    });
  }

  revalidatePath(`/tickets/${ticketId}`);
  return null;
}

// Dismiss a pending AI status suggestion without changing the status.
// Internal staff only — clients never see the suggestion in the first place.
export async function dismissSuggestedStatus(
  _prev: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const ticketId = String(formData.get("ticketId") ?? "");
  if (!ticketId) return { error: "Missing ticket." };

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
  if (!profile || !isInternal(profile.role)) {
    return { error: "Only support reps can do that." };
  }

  const { error } = await supabase
    .from("tickets")
    .update({ ai_suggested_status: null })
    .eq("id", ticketId);
  if (error) return { error: error.message };

  revalidatePath(`/tickets/${ticketId}`);
  return null;
}

// Assign (or unassign) a ticket to a support rep. Internal staff only.
export async function assignTicket(
  _prev: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const ticketId = String(formData.get("ticketId") ?? "");
  const agentId = String(formData.get("agentId") ?? "").trim(); // "" = unassign
  if (!ticketId) return { error: "Missing ticket." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  if (!profile || !isInternal(profile.role)) {
    return { error: "Only support reps can assign tickets." };
  }

  // Read the current assignee + subject so we only notify on a real change.
  // This read goes through the CALLER'S client, so RLS decides whether they may
  // touch this ticket at all — if they can't see it, they can't assign it.
  const { data: before } = await supabase
    .from("tickets")
    .select("assigned_agent_id, subject, organization_id, status")
    .eq("id", ticketId)
    .single();
  if (!before) return { error: "Ticket not found." };
  if (before.organization_id !== profile.organization_id) {
    return { error: "That ticket belongs to another organization." };
  }

  // The write itself must bypass RLS. PostgREST wraps updates in a CTE with
  // RETURNING, and Postgres applies SELECT policies to the returned row — so a
  // support_rep handing a ticket to a colleague fails with 42501, because the
  // updated row is (correctly) no longer visible to them. Assignment is exactly
  // the operation that moves a ticket out of your own view, so it can't be
  // performed under the viewer's own policies. Authorization is enforced above
  // and below instead: caller is internal and in the ticket's org, and the
  // assignee must be internal staff in that same org.
  const admin = createAdmin();

  if (agentId) {
    const { data: assignee } = await admin
      .from("profiles")
      .select("role, organization_id")
      .eq("id", agentId)
      .single();
    if (
      !assignee ||
      !isInternal(assignee.role) ||
      assignee.organization_id !== profile.organization_id
    ) {
      return { error: "That person can't be assigned tickets." };
    }
  }

  const { error } = await admin
    .from("tickets")
    .update({ assigned_agent_id: agentId || null })
    .eq("id", ticketId);
  if (error) return { error: error.message };

  // Picking up a ticket starts the work, so move a still-open ticket to
  // "in progress". The automatic acknowledgment reply never did this — it's
  // inserted directly, not through addReply — so without this an assigned
  // ticket would sit at "Open". Best-effort and logged like any transition;
  // done through the admin client for the same reason the assignment is (after
  // a hand-off the row may no longer be visible under the caller's policies).
  const currentStatus = before.status as TicketStatus;
  const autoStatus = autoStatusOnAssign(currentStatus, agentId || null);
  if (autoStatus) {
    const { error: moveError } = await admin
      .from("tickets")
      .update({ status: autoStatus })
      .eq("id", ticketId);
    if (!moveError) {
      await clearSuggestedStatus(admin, ticketId);
      await admin.from("ticket_status_history").insert({
        ticket_id: ticketId,
        old_status: currentStatus,
        new_status: autoStatus,
        changed_by: user.id,
      });
    }
  }

  // Notify on a real assignment change only — never on a no-op re-save of the
  // same person, and never on unassignment.
  const subject = before?.subject;
  if (agentId && subject && agentId !== before?.assigned_agent_id) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", agentId)
      .single();

    // Email the new assignee — but not if they assigned it to themselves.
    if (assignee?.email && agentId !== user.id) {
      await notifyAssignment({
        to: [assignee.email],
        ticketId,
        subject,
      });
    }

    // Slack: post every assignment, including self-assignment — picking up a
    // ticket is exactly what the team wants visible in the channel.
    const { data: actor } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();
    await slackTicketAssigned({
      ticketId,
      subject,
      assigneeName: assignee?.full_name || assignee?.email || "A support rep",
      assignedByName: actor?.full_name || actor?.email || user.email || "Someone",
    });
  }

  revalidatePath(`/tickets/${ticketId}`);

  // A rep who hands a ticket to someone else immediately loses sight of it (the
  // SELECT policy only shows them their own tickets plus unassigned ones), so
  // re-rendering the detail page would 404. Send them to the list instead —
  // the handoff succeeded, there's just nothing left for them to look at.
  if (
    profile.role === "support_rep" &&
    agentId &&
    agentId !== user.id
  ) {
    revalidatePath("/tickets");
    redirect("/tickets");
  }

  return null;
}

// Record time spent on a ticket (stored as total minutes). Internal staff only.
export async function updateTimeSpent(
  _prev: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const ticketId = String(formData.get("ticketId") ?? "");
  const hours = Number(formData.get("hours") ?? 0);
  const minutes = Number(formData.get("minutes") ?? 0);
  if (!ticketId) return { error: "Missing ticket." };
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    minutes < 0
  ) {
    return { error: "Enter valid hours and minutes." };
  }

  const total = Math.round(hours) * 60 + Math.round(minutes);

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
  if (!profile || !isInternal(profile.role)) {
    return { error: "Only support reps can log time." };
  }

  const { error } = await supabase
    .from("tickets")
    .update({ time_spent_minutes: total })
    .eq("id", ticketId);
  if (error) return { error: error.message };

  revalidatePath(`/tickets/${ticketId}`);
  return null;
}
