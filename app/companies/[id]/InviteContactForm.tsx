"use client";

import { useActionState } from "react";
import { CheckCircle2, KeyRound, Mail, ShieldAlert, UserPlus, UserRound } from "lucide-react";
import { inviteContact, type CompanyState } from "@/app/companies/actions";
import DarkField from "@/components/dashboard/DarkField";

export default function InviteContactForm({ companyId }: { companyId: string }) {
  const [state, formAction, pending] = useActionState<CompanyState, FormData>(
    inviteContact,
    null,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[20px] border border-white/[0.06] bg-[#16162e] p-6"
    >
      <input type="hidden" name="companyId" value={companyId} />

      {/* Single column: this form lives in the page's narrow right-hand
          column, where a two-up grid would squeeze the fields. */}
      <div className="grid grid-cols-1 gap-4">
        <DarkField
          label="Full name"
          name="fullName"
          type="text"
          placeholder="Jane Doe"
          icon={UserRound}
          autoComplete="name"
        />
        <DarkField
          label="Email"
          name="email"
          type="email"
          placeholder="jane@client.com"
          icon={Mail}
          autoComplete="email"
          required
        />
        <div>
          <DarkField
            label="Temporary password"
            name="password"
            type="text"
            placeholder="At least 6 characters"
            icon={KeyRound}
            required
            hint="Share this with them privately — they can change it after their first sign-in."
          />
        </div>
      </div>

      {state && "error" in state && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/[0.08] px-3.5 py-3 text-[13px] font-medium text-[#f87171]"
        >
          <ShieldAlert className="mt-px h-4 w-4 shrink-0" strokeWidth={2} />
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="flex items-start gap-2 rounded-xl border border-[#22c55e]/25 bg-[#22c55e]/[0.08] px-3.5 py-3 text-[13px] font-medium text-[#4ade80]">
          <CheckCircle2 className="mt-px h-4 w-4 shrink-0" strokeWidth={2} />
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] px-6 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <span className="psd-spinner h-4 w-4" />
            Adding…
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" strokeWidth={2.2} />
            Invite contact
          </>
        )}
      </button>
    </form>
  );
}
