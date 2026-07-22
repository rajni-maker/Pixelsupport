import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { initials, avatarGradient } from "@/components/dashboard/avatar";
import { roleLabel } from "@/lib/roles";
import { formatDateTime } from "@/lib/tickets";
import InviteColleagueForm from "./InviteColleagueForm";
import "@/components/dashboard/dark.css";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only a company contact (with a company) manages colleagues here.
  const { data: me } = await supabase
    .from("profiles")
    .select("role, company_id, full_name, email, companies(name)")
    .eq("id", user.id)
    .single();
  if (me?.role !== "company_contact" || !me.company_id) redirect("/dashboard");

  const companyName =
    (me.companies as { name?: string } | null)?.name ?? "your company";

  // Everyone at the same company (RLS scopes reads to the org).
  const { data: colleagues } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at")
    .eq("company_id", me.company_id)
    .order("created_at", { ascending: true });

  return (
    <div className="psd-shell min-h-screen bg-[#0a0a1a] font-[family-name:var(--font-inter)] text-[#f0f0f5] antialiased">
      <div className="relative z-[1]">
        <DashboardNav
          name={me.full_name || me.email || user.email || "there"}
          role={roleLabel(me.role)}
          internal={false}
          isContact
          current="contacts"
        />

        <main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
          {/* ================= Header ================= */}
          <section
            className="psd-in mb-7"
            style={{ "--psd-delay": "0.05s" } as React.CSSProperties}
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6b6b8a] transition-colors hover:text-[#f0f0f5]"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
              Back to dashboard
            </Link>

            <h1 className="psd-title mt-4 text-[28px] font-bold leading-tight tracking-[-0.025em] sm:text-[32px]">
              Contacts at {companyName}
            </h1>
            <p className="mt-1.5 text-[15px] text-[#a0a0b8]">
              People at your company who can create and reply to tickets.
            </p>
          </section>

          {/* ================= Colleagues ================= */}
          <section
            className="psd-in mb-10"
            style={{ "--psd-delay": "0.1s" } as React.CSSProperties}
          >
            {colleagues && colleagues.length > 0 ? (
              <div className="psd-panel overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#16162e]">
                {colleagues.map((c, i) => {
                  const name = c.full_name || c.email || "Unnamed";
                  return (
                    <div
                      key={c.id}
                      className={`psd-row flex items-center gap-4 px-7 py-5 ${
                        i ? "border-t border-white/[0.06]" : ""
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white shadow-[0_0_16px_rgba(139,92,246,0.2)] ${avatarGradient(c.id)}`}
                      >
                        {initials(name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[15px] font-semibold text-[#f0f0f5]">
                          <span className="truncate">{name}</span>
                          {c.id === user.id && (
                            <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6b6b8a]">
                              You
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[13px] text-[#6b6b8a]">
                          {c.email}
                        </p>
                      </div>
                      <span className="hidden shrink-0 text-xs text-[#4a4a6a] sm:block">
                        Added {formatDateTime(c.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-white/[0.08] bg-[#16162e] px-6 py-14 text-center">
                <p className="text-[15px] font-semibold text-[#f0f0f5]">
                  No colleagues yet
                </p>
                <p className="mt-1 text-[13px] text-[#6b6b8a]">
                  Invite the first one below so they can raise tickets too.
                </p>
              </div>
            )}
          </section>

          {/* ================= Invite ================= */}
          <section
            className="psd-in"
            style={{ "--psd-delay": "0.15s" } as React.CSSProperties}
          >
            <h2 className="mb-5 text-[18px] font-bold tracking-[-0.01em]">
              Add a colleague
            </h2>
            <InviteColleagueForm />
          </section>
        </main>
      </div>
    </div>
  );
}
