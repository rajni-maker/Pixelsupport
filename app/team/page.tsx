import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { initials, avatarGradient } from "@/components/dashboard/avatar";
import { isInternal, roleLabel, INTERNAL_ROLES } from "@/lib/roles";
import AddMemberForm from "./AddMemberForm";
import "@/components/dashboard/dark.css";

// A ticket is "active" until it's been resolved or closed.
const CLOSED_STATUSES = ["resolved", "closed"];

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Team management is internal-staff only.
  const { data: me } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();
  if (!isInternal(me?.role)) redirect("/dashboard");

  // The agency's own staff — org admins and support reps (RLS scopes to org).
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .in("role", INTERNAL_ROLES)
    .order("created_at", { ascending: true });

  // Read-only: open tickets per rep, so each row can show current workload.
  // One select of assigned_agent_id, tallied in memory.
  const { data: openTickets } = await supabase
    .from("tickets")
    .select("assigned_agent_id")
    .not("status", "in", `(${CLOSED_STATUSES.join(",")})`);

  const openByMember = new Map<string, number>();
  for (const t of openTickets ?? []) {
    if (!t.assigned_agent_id) continue;
    openByMember.set(
      t.assigned_agent_id,
      (openByMember.get(t.assigned_agent_id) ?? 0) + 1,
    );
  }

  return (
    <div className="psd-shell min-h-screen bg-[#0a0a1a] font-[family-name:var(--font-inter)] text-[#f0f0f5] antialiased">
      <div className="relative z-[1]">
        <DashboardNav
          name={me?.full_name || me?.email || user.email || "there"}
          role={roleLabel(me?.role)}
          internal
          isContact={false}
          current="team"
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
              Team
            </h1>
            <p className="mt-1.5 text-[15px] text-[#a0a0b8]">
              Your agency&apos;s staff. Client contacts are managed under{" "}
              <Link
                href="/companies"
                className="font-medium text-[#a78bfa] hover:underline"
              >
                Companies
              </Link>
              .
            </p>
          </section>

          {/* ================= Members ================= */}
          <section
            className="psd-in mb-10"
            style={{ "--psd-delay": "0.1s" } as React.CSSProperties}
          >
            <div className="psd-panel overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#16162e]">
              {members?.map((m, i) => {
                const name = m.full_name || m.email || "Unnamed";
                const open = openByMember.get(m.id) ?? 0;
                const isMe = m.id === user.id;
                return (
                  <div
                    key={m.id}
                    className={`psd-row flex flex-col gap-4 px-7 py-5 sm:flex-row sm:items-center sm:justify-between ${
                      i ? "border-t border-white/[0.06]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white shadow-[0_0_16px_rgba(139,92,246,0.2)] ${avatarGradient(m.id)}`}
                      >
                        {initials(name)}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[15px] font-semibold text-[#f0f0f5]">
                          <span className="truncate">{name}</span>
                          {isMe && (
                            <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6b6b8a]">
                              You
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[13px] text-[#6b6b8a]">
                          {m.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 pl-[60px] sm:pl-0">
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          open
                            ? "bg-[#f59e0b]/[0.12] text-[#fbbf24]"
                            : "bg-white/[0.06] text-[#6b6b8a]"
                        }`}
                      >
                        <Ticket className="h-3 w-3" strokeWidth={2.4} />
                        {open} open
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                          m.role === "organization_admin"
                            ? "bg-[#8b5cf6]/[0.12] text-[#a78bfa]"
                            : "bg-[#6366f1]/[0.12] text-[#818cf8]"
                        }`}
                      >
                        {roleLabel(m.role)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================= Add a rep ================= */}
          <section
            className="psd-in"
            style={{ "--psd-delay": "0.15s" } as React.CSSProperties}
          >
            <h2 className="mb-5 text-[18px] font-bold tracking-[-0.01em]">
              Add a Support Rep
            </h2>
            <AddMemberForm />
          </section>
        </main>
      </div>
    </div>
  );
}
