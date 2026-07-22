"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateTimeSpent, type TicketFormState } from "@/app/tickets/actions";

// "Time spent" control shown to internal staff. Hours + minutes are combined
// into total minutes on the server.
export default function TimeControl({
  ticketId,
  totalMinutes,
}: {
  ticketId: string;
  totalMinutes: number;
}) {
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(
    updateTimeSpent,
    null,
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="ticketId" value={ticketId} />
      <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a0a0b8]">
        Time spent
      </span>

      <div className="flex w-full items-center gap-2">
        <input
          name="hours"
          type="number"
          min={0}
          defaultValue={hours}
          aria-label="Hours spent"
          className="psd-input w-[70px] rounded-xl border border-white/[0.06] bg-[#11112a] px-2 py-2.5 text-center text-sm text-[#f0f0f5] outline-none"
        />
        <span className="text-[13px] text-[#6b6b8a]">h</span>
        <input
          name="minutes"
          type="number"
          min={0}
          max={59}
          defaultValue={minutes}
          aria-label="Minutes spent"
          className="psd-input w-[70px] rounded-xl border border-white/[0.06] bg-[#11112a] px-2 py-2.5 text-center text-sm text-[#f0f0f5] outline-none"
        />
        <span className="text-[13px] text-[#6b6b8a]">m</span>
      </div>

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
