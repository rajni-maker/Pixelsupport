// Shared labels + colors for ticket status and priority, used across pages.

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_on_client"
  | "testing"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_on_client: "Waiting on Client",
  testing: "Testing",
  resolved: "Resolved",
  closed: "Closed",
};

export const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-700 ring-blue-200",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-200",
  waiting_on_client: "bg-purple-50 text-purple-700 ring-purple-200",
  testing: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  resolved: "bg-green-50 text-green-700 ring-green-200",
  closed: "bg-gray-100 text-gray-600 ring-gray-200",
};

// Dark-theme variants, used by the redesigned screens. Kept alongside the light
// styles above rather than replacing them, because the ticket detail page is
// still on the light theme.
export const DARK_STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-[#6366f1]/[0.12] text-[#818cf8]",
  in_progress: "bg-[#f59e0b]/[0.12] text-[#fbbf24]",
  waiting_on_client: "bg-[#8b5cf6]/[0.12] text-[#a78bfa]",
  testing: "bg-[#06b6d4]/[0.12] text-[#22d3ee]",
  resolved: "bg-[#22c55e]/[0.12] text-[#4ade80]",
  closed: "bg-white/[0.06] text-[#a0a0b8]",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "bg-gray-100 text-gray-600 ring-gray-200",
  medium: "bg-blue-50 text-blue-700 ring-blue-200",
  high: "bg-orange-50 text-orange-700 ring-orange-200",
  urgent: "bg-red-50 text-red-700 ring-red-200",
};

export const DARK_PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "bg-[#22c55e]/[0.12] text-[#4ade80]",
  medium: "bg-[#6366f1]/[0.12] text-[#818cf8]",
  high: "bg-[#f97316]/[0.12] text-[#fb923c]",
  urgent: "bg-[#ef4444]/[0.12] text-[#f87171]",
};

// Order used to populate the priority dropdown on the new-ticket form.
export const PRIORITY_OPTIONS: TicketPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

// Order used to populate the status dropdown on the ticket detail page.
export const STATUS_OPTIONS: TicketStatus[] = [
  "open",
  "in_progress",
  "waiting_on_client",
  "testing",
  "resolved",
  "closed",
];

// ---------------------------------------------------------------------------
// Automatic status movement
//
// A reply is the one event that reliably tells us a ticket has moved on, so it
// drives the status. Only the transitions that need no judgement happen on
// their own; deciding a ticket is *resolved* stays with a human (see
// ai_suggested_status). Tickets that are already resolved or closed are left
// alone — reopening is a decision, not a side effect of someone commenting.
// ---------------------------------------------------------------------------

/**
 * The status a ticket should move to when a reply lands, or `null` to leave it
 * as-is. Pure and side-effect free so the rules stay readable and testable.
 *
 * @param current          the ticket's status right now
 * @param senderIsInternal true when an admin/rep replied, false for the client
 */
export function autoStatusOnReply(
  current: TicketStatus,
  senderIsInternal: boolean,
): TicketStatus | null {
  // Never auto-move a finished ticket. Only a person reopens one.
  if (current === "resolved" || current === "closed") return null;

  if (senderIsInternal) {
    // Support has picked it up — an untouched ticket is now being worked on.
    // If support is waiting on the client, replying again doesn't change that.
    return current === "open" ? "in_progress" : null;
  }

  // The client answered the question support was waiting for.
  return current === "waiting_on_client" ? "in_progress" : null;
}

/**
 * The status a ticket should move to when it's assigned to a rep, or `null` to
 * leave it as-is. Handing a ticket to someone is a promise that work is
 * starting, so a still-*open* ticket becomes *in progress*. Everything else is
 * left alone: a ticket already being worked, waiting on the client, in testing,
 * or finished shouldn't be dragged backwards just because it changed hands.
 * Unassigning (no agent) never moves the status either.
 *
 * @param current the ticket's status right now
 * @param agentId the rep being assigned, or "" / null when unassigning
 */
export function autoStatusOnAssign(
  current: TicketStatus,
  agentId: string | null,
): TicketStatus | null {
  if (!agentId) return null;
  return current === "open" ? "in_progress" : null;
}
export function formatMinutes(total: number | null | undefined): string {
  const m = Math.max(0, Math.round(total ?? 0));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h && rem) return `${h}h ${rem}m`;
  if (h) return `${h}h`;
  return `${rem}m`;
}

// Format a timestamp as date + time, e.g. "Jul 19, 2026, 3:45 PM".
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
