"use client";

import { useActionState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { createCompany, type CompanyState } from "@/app/companies/actions";

export default function AddCompanyForm() {
  const [state, formAction, pending] = useActionState<CompanyState, FormData>(
    createCompany,
    null,
  );

  return (
    <div className="psd-panel rounded-[20px] border border-white/[0.06] bg-[#16162e] p-7">
      <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2.5">
          <label htmlFor="name" className="text-[13px] font-semibold text-[#a0a0b8]">
            Company name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. RDT, BigBadBikes, Ashoka University"
            className="psd-input h-[46px] w-full rounded-xl border border-white/[0.06] bg-[#11112a] px-4 text-[15px] text-[#f0f0f5] outline-none placeholder:text-[#4a4a6a]"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex h-[46px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#f0f0f5] px-6 text-sm font-semibold text-[#0a0a1a] transition-all hover:-translate-y-px hover:opacity-90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <span className="psd-spinner psd-spinner-dark h-4 w-4" />
              Adding…
            </>
          ) : (
            "Add company"
          )}
        </button>
      </form>

      {state && "error" in state && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/[0.08] px-3.5 py-3 text-[13px] font-medium text-[#f87171]"
        >
          <ShieldAlert className="mt-px h-4 w-4 shrink-0" strokeWidth={2} />
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#22c55e]/25 bg-[#22c55e]/[0.08] px-3.5 py-3 text-[13px] font-medium text-[#4ade80]">
          <CheckCircle2 className="mt-px h-4 w-4 shrink-0" strokeWidth={2} />
          {state.success}
        </p>
      )}
    </div>
  );
}
