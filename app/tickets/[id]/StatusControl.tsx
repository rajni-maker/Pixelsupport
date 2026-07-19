"use client";

import { useActionState } from "react";
import { changeStatus, type TicketFormState } from "@/app/tickets/actions";
import { STATUS_OPTIONS, STATUS_LABELS, type TicketStatus } from "@/lib/tickets";

// A small "change status" control shown to admins/agents on the ticket detail page.
export default function StatusControl({
  ticketId,
  current,
}: {
  ticketId: string;
  current: TicketStatus;
}) {
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(
    changeStatus,
    null,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <select
        name="status"
        defaultValue={current}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update"}
      </button>
      {state?.error && (
        <span className="text-xs text-red-700">{state.error}</span>
      )}
    </form>
  );
}
