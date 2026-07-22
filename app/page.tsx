import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, PenLine, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import "@/components/auth/auth.css";

const POINTS = [
  { icon: Ticket, label: "Smart ticketing" },
  { icon: Sparkles, label: "AI triage & summaries" },
  { icon: PenLine, label: "Drafted replies you approve" },
];

export default async function Home() {
  // If already logged in, skip the landing page and go to the dashboard.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0B1020] px-5 py-16 text-center font-[family-name:var(--font-inter)]">
      {/* Same ambient layers as the auth hero, so the entry point matches the
          screens it leads into. */}
      <div className="ps-aurora pointer-events-none absolute -inset-[15%]" />
      <div className="ps-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,#000_35%,transparent_100%)]" />
      <div className="ps-rays pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,9,20,0.75)_100%)]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="ps-particle" />
        ))}
      </div>

      <div className="ps-rise relative z-10 flex max-w-[640px] flex-col items-center">
        {/* Wordmark */}
        <div className="mb-9 flex items-center gap-3">
          <span className="ps-logo-glow flex h-11 w-11 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#7C3AED] to-[#06B6D4]">
            <Sparkles className="h-5 w-5 text-white" strokeWidth={2.2} />
          </span>
          <span className="text-[25px] font-extrabold tracking-[-0.02em] text-white">
            PixelSupport
          </span>
        </div>

        <h1 className="ps-headline mb-5 text-[38px] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">
          Support that thinks
          <br />
          before you type
        </h1>

        <p className="mb-9 max-w-[460px] text-[16px] leading-relaxed text-white/60">
          A lightweight, AI-assisted helpdesk. Stop babysitting tickets — AI
          sorts and drafts, you approve and send.
        </p>

        <div className="mb-12 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="ps-cta flex h-[54px] items-center justify-center gap-2 rounded-xl px-8 text-[15px] font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-[#4F46E5]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1020]"
          >
            Get started
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </Link>
          <Link
            href="/login"
            className="flex h-[54px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-8 text-[15px] font-medium text-white/90 backdrop-blur-md transition-colors hover:border-white/25 hover:bg-white/[0.1]"
          >
            Log in
          </Link>
        </div>

        {/* Capability row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/10 pt-7">
          {POINTS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 text-[13px] text-white/45"
            >
              <Icon className="h-4 w-4 text-white/35" strokeWidth={1.8} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-2 text-[13px] text-white/45">
            <ShieldCheck className="h-4 w-4 text-white/35" strokeWidth={1.8} />
            Every reply has a human behind it
          </span>
        </div>
      </div>
    </main>
  );
}
