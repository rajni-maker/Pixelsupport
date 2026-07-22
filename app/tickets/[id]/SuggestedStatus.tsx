"use client";

import { useActionState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { changeStatus, dismissSuggestedStatus } from "@/app/tickets/actions";
import type { TicketFormState } from "@/app/tickets/actions";
import { STATUS_LABELS, type TicketStatus } from "@/lib/tickets";

// Shown to internal staff when a client's reply looks like it confirms the fix.
// Applying routes through the ordinary changeStatus action, so the transition is
// permission-checked and written to the history log like any manual change —
// the AI proposes, a person decides.
export default function SuggestedStatus({
  ticketId,
  suggested,
}: {
  ticketId: string;
  suggested: TicketStatus;
}) {
  const [applyState, applyAction, applying] = useActionState<
    TicketFormState,
    FormData
  >(changeStatus, null);
  const [dismissState, dismissAction, dismissing] = useActionState<
    TicketFormState,
    FormData
  >(dismissSuggestedStatus, null);

  const error = applyState?.error ?? dismissState?.error;
  const busy = applying || dismissing;

  return (
    <div className="mb-4 rounded-[18px] border border-[#8b5cf6]/25 bg-[#8b5cf6]/[0.08] px-4 py-3.5">
      <p className="flex items-start gap-2 text-[13px] font-semibold text-[#a78bfa]">
        <Sparkles className="mt-px h-4 w-4 shrink-0" strokeWidth={2.2} />
        The client&rsquo;s last reply suggests this is{" "}
        {STATUS_LABELS[suggested].toLowerCase()}.
      </p>
      <p className="mt-1 pl-6 text-xs text-[#6b6b8a]">
        Nothing has changed yet — you decide.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 pl-6">
        <form action={applyAction}>
          <input type="hidden" name="ticketId" value={ticketId} />
          <input type="hidden" name="status" value={suggested} />
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-px disabled:translate-y-0 disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
            {applying ? "Applying…" : `Mark ${STATUS_LABELS[suggested]}`}
          </button>
        </form>

        <form action={dismissAction}>
          <input type="hidden" name="ticketId" value={ticketId} />
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[#6b6b8a] transition-colors hover:bg-white/[0.04] hover:text-[#a0a0b8] disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.2} />
            {dismissing ? "Dismissing…" : "Dismiss"}
          </button>
        </form>
      </div>

      {error && (
        <p role="alert" className="mt-2 pl-6 text-xs font-medium text-[#f87171]">
          {error}
        </p>
      )}
    </div>
  );
}
