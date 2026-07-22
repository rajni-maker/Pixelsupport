"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ShieldAlert } from "lucide-react";
import { createTicket, type TicketFormState } from "@/app/tickets/actions";
import { PRIORITY_OPTIONS, PRIORITY_LABELS } from "@/lib/tickets";

type Company = { id: string; name: string };

// The ticket form. Internal staff (admin/rep) choose which client company the
// ticket is for; a company contact's tickets are always their own company, so
// they don't see the picker.
export default function NewTicketForm({
  isInternal,
  companies,
  defaultCompanyId = "",
  cancelHref = "/tickets",
}: {
  isInternal: boolean;
  companies: Company[];
  /** Pre-picked client when arriving from a company's detail page. */
  defaultCompanyId?: string;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(
    createTicket,
    null,
  );

  return (
    <form
      action={formAction}
      className="psd-panel rounded-[20px] border border-white/[0.06] bg-[#16162e] p-6 sm:p-8"
    >
      {isInternal && (
        <div className="mb-6">
          <Label htmlFor="companyId">Company</Label>
          <select
            id="companyId"
            name="companyId"
            required
            defaultValue={defaultCompanyId}
            className="psd-select w-full cursor-pointer rounded-xl border border-white/[0.06] bg-[#11112a] py-3 pl-4 pr-10 text-[15px] text-[#f0f0f5] outline-none"
          >
            <option value="" disabled>
              {companies.length ? "Select a client company…" : "No companies yet"}
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-6">
        <Label htmlFor="subject">Subject</Label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          placeholder="Short summary of the issue"
          className="psd-input w-full rounded-xl border border-white/[0.06] bg-[#11112a] px-4 py-3.5 text-[15px] text-[#f0f0f5] outline-none placeholder:text-[#4a4a6a]"
        />
      </div>

      <div className="mb-6">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          placeholder="What's happening? Steps to reproduce, links, etc."
          className="psd-input min-h-[140px] w-full resize-y rounded-xl border border-white/[0.06] bg-[#11112a] px-4 py-3.5 text-[15px] leading-relaxed text-[#f0f0f5] outline-none placeholder:text-[#4a4a6a]"
        />
      </div>

      <div className="mb-6">
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          name="priority"
          defaultValue="medium"
          className="psd-select w-full cursor-pointer rounded-xl border border-white/[0.06] bg-[#11112a] py-3 pl-4 pr-10 text-[15px] text-[#f0f0f5] outline-none"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/[0.08] px-3.5 py-3 text-[13px] font-medium text-[#f87171]"
        >
          <ShieldAlert className="mt-px h-4 w-4 shrink-0" strokeWidth={2} />
          {state.error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:gap-4">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <>
              <span className="psd-spinner h-4 w-4" />
              Creating…
            </>
          ) : (
            "Create ticket"
          )}
        </button>
        <Link
          href={cancelHref}
          className="rounded-xl px-6 py-3 text-center text-[15px] font-medium text-[#6b6b8a] transition-colors hover:bg-white/[0.04] hover:text-[#a0a0b8]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2.5 block text-[13px] font-semibold text-[#a0a0b8]"
    >
      {children}
    </label>
  );
}
