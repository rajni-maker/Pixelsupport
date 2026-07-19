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

// Order used to populate the priority dropdown on the new-ticket form.
export const PRIORITY_OPTIONS: TicketPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

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
