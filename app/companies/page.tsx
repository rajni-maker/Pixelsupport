import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { avatarGradient } from "@/components/dashboard/avatar";
import { isInternal, roleLabel } from "@/lib/roles";
import AddCompanyForm from "./AddCompanyForm";
import "@/components/dashboard/dark.css";

// A ticket is "active" until it's been resolved or closed.
const CLOSED_STATUSES = ["resolved", "closed"];

export default async function CompaniesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Managing client companies is internal-staff only.
  const { data: me } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();
  if (!isInternal(me?.role)) redirect("/dashboard");

  // This agency's client companies, with a contact count each. RLS scopes to org.
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, created_at, profiles(count)")
    .order("name", { ascending: true });

  // Read-only: active tickets per company, for the row meta line. One select of
  // company_id, tallied in memory — no schema or policy changes.
  const { data: openTickets } = await supabase
    .from("tickets")
    .select("company_id")
    .not("status", "in", `(${CLOSED_STATUSES.join(",")})`);

  const openByCompany = new Map<string, number>();
  for (const t of openTickets ?? []) {
    if (!t.company_id) continue;
    openByCompany.set(t.company_id, (openByCompany.get(t.company_id) ?? 0) + 1);
  }

  const total = companies?.length ?? 0;

  return (
    <div className="psd-shell min-h-screen bg-[#0a0a1a] font-[family-name:var(--font-inter)] text-[#f0f0f5] antialiased">
      <div className="relative z-[1]">
        <DashboardNav
          name={me?.full_name || me?.email || user.email || "there"}
          role={roleLabel(me?.role)}
          internal
          isContact={false}
          current="companies"
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
              Companies
            </h1>
            <p className="mt-1.5 text-[15px] text-[#a0a0b8]">
              Your client companies. Open one to invite its contacts.
            </p>
          </section>

          {/* ================= Company list ================= */}
          <section
            className="psd-in mb-10"
            style={{ "--psd-delay": "0.1s" } as React.CSSProperties}
          >
            {total === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/[0.08] bg-[#16162e] px-6 py-16 text-center">
                <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8b5cf6]/[0.12] text-[#8b5cf6]">
                  <Building2 className="h-5 w-5" strokeWidth={2} />
                </span>
                <p className="text-[15px] font-semibold text-[#f0f0f5]">
                  No client companies yet
                </p>
                <p className="text-[13px] text-[#6b6b8a]">
                  Add your first one below to start inviting its contacts.
                </p>
              </div>
            ) : (
              <div className="psd-panel overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#16162e]">
                {(companies ?? []).map((c, i) => {
                  const contacts =
                    (c.profiles as { count: number }[] | null)?.[0]?.count ?? 0;
                  const open = openByCompany.get(c.id) ?? 0;
                  return (
                    <Link
                      key={c.id}
                      href={`/companies/${c.id}`}
                      className={`psd-row group flex items-center justify-between gap-4 px-7 py-5 ${
                        i ? "border-t border-white/[0.06]" : ""
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-4">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-[0_0_16px_rgba(139,92,246,0.2)] ${avatarGradient(c.id)}`}
                        >
                          {c.name.trim().charAt(0).toUpperCase() || "?"}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-base font-semibold text-[#f0f0f5]">
                            {c.name}
                          </span>
                          <span className="block text-[13px] text-[#6b6b8a]">
                            {open} active {open === 1 ? "ticket" : "tickets"}
                          </span>
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-[#6b6b8a] transition-colors group-hover:text-[#a78bfa]">
                        <span className="hidden sm:inline">
                          {contacts} {contacts === 1 ? "contact" : "contacts"}
                        </span>
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          strokeWidth={2}
                        />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* ================= Add company ================= */}
          <section
            className="psd-in"
            style={{ "--psd-delay": "0.15s" } as React.CSSProperties}
          >
            <h2 className="mb-5 text-[18px] font-bold tracking-[-0.01em]">
              Add a company
            </h2>
            <AddCompanyForm />
          </section>
        </main>
      </div>
    </div>
  );
}
