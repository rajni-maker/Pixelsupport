"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
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
    <form action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="ticketId" value={ticketId} />
      <label
        htmlFor="status"
        className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a0a0b8]"
      >
        Status
      </label>
      {/* Uncontrolled so the user can browse options before committing, but
          keyed on the server value: `defaultValue` is only applied on mount, so
          without this the dropdown keeps showing the old status after the
          status changes elsewhere (an AI suggestion applied, or an automatic
          move on reply). Re-keying remounts it with the new value. */}
      <select
        key={current}
        id="status"
        name="status"
        defaultValue={current}
        className="psd-select w-full cursor-pointer rounded-xl border border-white/[0.06] bg-[#11112a] py-2.5 pl-3.5 pr-9 text-sm text-[#f0f0f5] outline-none"
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
        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] px-4 py-2.5 text-[13px] font-medium text-[#6b6b8a] transition-all hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-[#a0a0b8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <span className="psd-spinner psd-spinner-muted h-3.5 w-3.5" />
            Updating…
          </>
        ) : (
          <>
            <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
            Update
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
