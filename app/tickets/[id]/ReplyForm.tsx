"use client";

import { useState, useTransition } from "react";
import { Bot, Send, ShieldAlert, Sparkles } from "lucide-react";
import { addReply } from "@/app/tickets/actions";
import { draftReply } from "@/app/tickets/ai-actions";
import { draftPerspective } from "@/lib/roles";

const DRAFT_TOOLTIP = "Generate a draft based on your role in this conversation.";

// The reply box at the bottom of a ticket, with an optional AI draft button.
// The AI fills the box; the user edits before sending. Never auto-sent.
//
// The button is labelled for the side of the conversation you're on — a client
// is being helped to write, a rep is generating a support reply. `viewerRole`
// only drives that label; the draft's actual voice is decided server-side in
// draftReply() from the session, so it can't be influenced from the browser.
export default function ReplyForm({
  ticketId,
  viewerRole,
}: {
  ticketId: string;
  viewerRole?: string | null;
}) {
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

  // "Help me write" for the customer, "Generate reply" for support staff.
  const asClient = draftPerspective(viewerRole) === "client";
  const DraftIcon = asClient ? Sparkles : Bot;
  const draftLabel = asClient ? "Help Me Write" : "Generate Reply";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[20px] border border-white/[0.06] bg-[#16162e] px-6 py-5 transition-all focus-within:border-[#8b5cf6] focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Write a reply…"
        aria-label="Reply"
        className="min-h-[80px] w-full resize-y border-none bg-transparent text-sm leading-relaxed text-[#f0f0f5] outline-none placeholder:text-[#4a4a6a]"
      />

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/[0.08] px-3.5 py-3 text-[13px] font-medium text-[#f87171]"
        >
          <ShieldAlert className="mt-px h-4 w-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-3 border-t border-white/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleDraft}
          disabled={isDrafting}
          title={DRAFT_TOOLTIP}
          aria-label={`${draftLabel} — ${DRAFT_TOOLTIP}`}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#8b5cf6]/[0.15] bg-[#8b5cf6]/[0.08] px-4 py-2 text-[13px] font-semibold text-[#a78bfa] transition-all hover:bg-[#8b5cf6]/[0.12] hover:shadow-[0_0_16px_rgba(139,92,246,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDrafting ? (
            <>
              <span className="psd-spinner psd-spinner-accent h-3.5 w-3.5" />
              Drafting…
            </>
          ) : (
            <>
              <DraftIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {draftLabel}
            </>
          )}
        </button>

        <button
          type="submit"
          disabled={isSending || !body.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {isSending ? (
            <>
              <span className="psd-spinner h-4 w-4" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" strokeWidth={2.2} />
              Send reply
            </>
          )}
        </button>
      </div>
    </form>
  );
}
