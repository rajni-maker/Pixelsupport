"use client";

import { useActionState } from "react";
import { addReply, type TicketFormState } from "@/app/tickets/actions";

// The reply box at the bottom of a ticket. Submits to the addReply server action.
export default function ReplyForm({ ticketId }: { ticketId: string }) {
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(
    addReply,
    null,
  );

  return (
    <form action={formAction} className="mt-4">
      {/* Hidden field tells the server which ticket this reply belongs to. */}
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea
        name="body"
        rows={3}
        required
        placeholder="Write a reply…"
        className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      />
      {state?.error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reply"}
        </button>
      </div>
    </form>
  );
}
