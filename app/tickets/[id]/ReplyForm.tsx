"use client";

import { useState, useTransition } from "react";
import { addReply } from "@/app/tickets/actions";
import { draftReply } from "@/app/tickets/ai-actions";

// The reply box at the bottom of a ticket, with an optional "Draft with AI"
// button. The AI fills the box; the agent edits before sending. Never auto-sent.
export default function ReplyForm({ ticketId }: { ticketId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, startSending] = useTransition();
  const [isDrafting, startDrafting] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const fd = new FormData();
    fd.set("ticketId", ticketId);
    fd.set("body", body);
    startSending(async () => {
      const result = await addReply(null, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setBody(""); // clear on success; the thread refreshes with the new reply
        setError(null);
      }
    });
  }

  function handleDraft() {
    setError(null);
    startDrafting(async () => {
      const result = await draftReply(ticketId);
      if (result.error) setError(result.error);
      else setBody(result.draft ?? "");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Write a reply…"
        className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      />
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={handleDraft}
          disabled={isDrafting}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
        >
          {isDrafting ? "Drafting…" : "✨ Draft with AI"}
        </button>
        <button
          type="submit"
          disabled={isSending || !body.trim()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {isSending ? "Sending…" : "Send reply"}
        </button>
      </div>
    </form>
  );
}
