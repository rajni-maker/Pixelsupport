"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { assignTicket, type TicketFormState } from "@/app/tickets/actions";

type Rep = { id: string; name: string };

// "Assign to" control shown to internal staff on the ticket detail page.
export default function AssignControl({
  ticketId,
  current,
  reps,
}: {
  ticketId: string;
  current: string | null;
  reps: Rep[];
}) {
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(
    assignTicket,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="ticketId" value={ticketId} />
      <label
        htmlFor="agentId"
        className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a0a0b8]"
      >
        Assigned to
      </label>
      {/* Keyed on the server value for the same reason as StatusControl —
          `defaultValue` alone would leave a stale assignee on screen. */}
      <select
        key={current ?? "unassigned"}
        id="agentId"
        name="agentId"
        defaultValue={current ?? ""}
        className="psd-select w-full cursor-pointer rounded-xl border border-white/[0.06] bg-[#11112a] py-2.5 pl-3.5 pr-9 text-sm text-[#f0f0f5] outline-none"
      >
        <option value="">Unassigned</option>
        {reps.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] px-4 py-2.5 text-[13px] font-medium text-[#6b6b8a] transition-all hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-[#a0a0b8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <span className="psd-spinner psd-spinner-muted h-3.5 w-3.5" />
            Saving…
          </>
        ) : (
          <>
            <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
            Save
          </>
        )}
      </button>
      {state?.error && (
        <p role="alert" className="text-xs font-medium text-[#f87171]">
          {state.error}
        </p>
      )}
    </form>
  );
}
