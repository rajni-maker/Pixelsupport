import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Inbox,
  Plus,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { initials, avatarGradient } from "@/components/dashboard/avatar";
import TicketVolumeChart, { type Bucket } from "./TicketVolumeChart";
import { isInternal, roleLabel, INTERNAL_ROLES } from "@/lib/roles";
import { STATUS_LABELS, type TicketStatus } from "@/lib/tickets";
import "@/components/dashboard/dark.css";

// A ticket is "active" until it's been resolved or closed.
const CLOSED_STATUSES = ["resolved", "closed"];

// Chart ranges offered above the volume chart. URL-driven (?range=), matching
// how the ticket list already does its filters — no client JS needed.
const RANGES = [7, 30, 90] as const;
const DEFAULT_RANGE = 30;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const days = RANGES.includes(Number(range) as (typeof RANGES)[number])
    ? Number(range)
    : DEFAULT_RANGE;

  const supabase = await createClient();

  // Who is logged in? (getUser is the trusted, server-verified check.)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in -> bounce to the login screen.
  if (!user) redirect("/login");

  // Load this user's profile + their organization name in one query.
  // RLS guarantees we can only read our own org's data.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, email, organizations(name), companies(name)")
    .eq("id", user.id)
    .single();

  const orgName =
    (profile?.organizations as { name?: string } | null)?.name ?? "—";
  const companyName =
    (profile?.companies as { name?: string } | null)?.name ?? null;
  const internal = isInternal(profile?.role);
  const isContact = profile?.role === "company_contact";

  const displayName = profile?.full_name || profile?.email || user.email || "there";
  const firstName = displayName.split(/[\s@]/)[0];

  // Window boundaries for the metrics below.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - (days - 1));
  windowStart.setHours(0, 0, 0, 0);

  // ---- Read-only metrics -------------------------------------------------
  // Every query below is a SELECT (most are head-only counts). Nothing is
  // written, and RLS scopes each one to what this viewer may already see —
  // a support rep's numbers cover their own + unassigned tickets, a company
  // contact's cover their company, an admin's cover the whole org.
  const [
    activeRes,
    urgentRes,
    resolvedTodayRes,
    totalRes,
    unassignedRes,
    companiesRes,
    teamRes,
    volumeRes,
  ] = await Promise.all([
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .not("status", "in", `(${CLOSED_STATUSES.join(",")})`),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("priority", "urgent")
      .not("status", "in", `(${CLOSED_STATUSES.join(",")})`),
    supabase
      .from("ticket_status_history")
      .select("*", { count: "exact", head: true })
      .eq("new_status", "resolved")
      .gte("changed_at", startOfToday.toISOString()),
    supabase.from("tickets").select("*", { count: "exact", head: true }),
    internal
      ? supabase
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .is("assigned_agent_id", null)
          .not("status", "in", `(${CLOSED_STATUSES.join(",")})`)
      : Promise.resolve({ count: null }),
    internal
      ? supabase.from("companies").select("*", { count: "exact", head: true })
      : Promise.resolve({ count: null }),
    internal
      ? supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .in("role", INTERNAL_ROLES)
      : Promise.resolve({ count: null }),
    supabase
      .from("tickets")
      .select("created_at")
      .gte("created_at", windowStart.toISOString())
      .order("created_at", { ascending: true }),
  ]);

  const activeCount = activeRes.count ?? 0;
  const urgentCount = urgentRes.count ?? 0;
  const resolvedToday = resolvedTodayRes.count ?? 0;
  const totalCount = totalRes.count ?? 0;
  const unassignedCount = unassignedRes.count ?? 0;
  const companiesCount = companiesRes.count ?? 0;
  const teamCount = teamRes.count ?? 0;

  const buckets = toDailyBuckets(
    (volumeRes.data ?? []).map((t) => t.created_at as string),
    windowStart,
    days,
  );
  const createdInWindow = buckets.reduce((n, b) => n + b.count, 0);

  // ---- Recent activity ---------------------------------------------------
  // Status changes are the one activity stream that already exists. Two plain
  // selects: the latest changes, then the names behind them.
  const { data: history } = await supabase
    .from("ticket_status_history")
    .select("id, ticket_id, old_status, new_status, changed_at, changed_by, tickets(subject)")
    .order("changed_at", { ascending: false })
    .limit(5);

  const actorIds = [
    ...new Set((history ?? []).map((h) => h.changed_by).filter(Boolean)),
  ] as string[];
  const { data: actors } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", actorIds)
    : { data: [] };
  const actorName = new Map(
    (actors ?? []).map((a) => [a.id, a.full_name || a.email || "Someone"]),
  );

  return (
    <div className="psd-shell min-h-screen bg-[#0a0a1a] font-[family-name:var(--font-inter)] text-[#f0f0f5] antialiased">
      <div className="relative z-[1]">
        <DashboardNav
          name={displayName}
          role={roleLabel(profile?.role)}
          internal={internal}
          isContact={isContact}
          current="dashboard"
        />

        <main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
          {/* ================= Welcome ================= */}
          <section
            className="psd-in mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end"
            style={{ "--psd-delay": "0.05s" } as React.CSSProperties}
          >
            <div>
              <h1 className="psd-title text-[28px] font-bold leading-tight tracking-[-0.025em] sm:text-[32px]">
                Welcome back, {firstName}
              </h1>
              <p className="mt-1.5 text-[15px] text-[#a0a0b8]">
                Here&apos;s what&apos;s happening at {orgName} today.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/tickets/new"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} />
                New ticket
              </Link>
              <Link
                href="/tickets"
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-[#a0a0b8] transition-colors hover:border-white/[0.12] hover:bg-white/[0.08] hover:text-[#f0f0f5]"
              >
                <Inbox className="h-4 w-4" strokeWidth={2} />
                View all tickets
              </Link>
            </div>
          </section>

          {/* ================= Stats ================= */}
          <section
            className="psd-in mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            style={{ "--psd-delay": "0.1s" } as React.CSSProperties}
          >
            <StatCard
              label="Open Tickets"
              value={activeCount}
              icon={Ticket}
              tone="blue"
              note="Not yet resolved or closed"
            />
            <StatCard
              label="Resolved Today"
              value={resolvedToday}
              icon={CheckCircle2}
              tone="green"
              note="Marked resolved since midnight"
            />
            <StatCard
              label="Urgent"
              value={urgentCount}
              icon={AlertTriangle}
              tone="amber"
              note="Open tickets at urgent priority"
            />
            {internal ? (
              <StatCard
                label="Unassigned"
                value={unassignedCount}
                icon={UserRound}
                tone="purple"
                note="Open and waiting to be picked up"
              />
            ) : (
              <StatCard
                label="Total Tickets"
                value={totalCount}
                icon={Inbox}
                tone="purple"
                note="Everything you've raised with us"
              />
            )}
          </section>

          {/* ================= Chart + activity ================= */}
          <section
            className="psd-in mb-7 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]"
            style={{ "--psd-delay": "0.15s" } as React.CSSProperties}
          >
            <div className="psd-panel rounded-[20px] border border-white/[0.06] bg-[#16162e] p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[17px] font-bold tracking-[-0.01em]">
                    Ticket Volume
                  </h2>
                  <p className="mt-1 text-[13px] text-[#6b6b8a]">
                    {createdInWindow} created in the last {days} days
                  </p>
                </div>
                <div className="flex gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
                  {RANGES.map((r) => (
                    <Link
                      key={r}
                      href={`/dashboard?range=${r}`}
                      scroll={false}
                      className={
                        r === days
                          ? "rounded-lg bg-[#8b5cf6]/[0.15] px-3.5 py-1.5 text-xs font-semibold text-[#a78bfa]"
                          : "rounded-lg px-3.5 py-1.5 text-xs font-medium text-[#6b6b8a] transition-colors hover:text-[#f0f0f5]"
                      }
                    >
                      {r} days
                    </Link>
                  ))}
                </div>
              </div>
              <TicketVolumeChart buckets={buckets} />
            </div>

            <div className="psd-panel rounded-[20px] border border-white/[0.06] bg-[#16162e] p-7">
              <h2 className="mb-6 text-[17px] font-bold tracking-[-0.01em]">
                Recent Activity
              </h2>

              {history?.length ? (
                <div className="flex flex-col">
                  {history.map((h) => {
                    const who = actorName.get(h.changed_by as string) ?? "Someone";
                    const subject =
                      (h.tickets as { subject?: string } | null)?.subject ??
                      "a ticket";
                    return (
                      <Link
                        key={h.id}
                        href={`/tickets/${h.ticket_id}`}
                        className="-mx-3 flex gap-3.5 rounded-xl px-3 py-4 transition-colors first:pt-0 hover:bg-white/[0.02] [&:not(:last-child)]:border-b [&:not(:last-child)]:border-white/[0.06]"
                      >
                        <span
                          className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white shadow-[0_0_12px_rgba(139,92,246,0.2)] ${avatarGradient((h.changed_by as string) ?? who)}`}
                        >
                          {initials(who)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] leading-relaxed text-[#a0a0b8]">
                            <strong className="font-semibold text-[#f0f0f5]">
                              {who}
                            </strong>{" "}
                            set{" "}
                            <strong className="font-semibold text-[#f0f0f5]">
                              {subject}
                            </strong>{" "}
                            to{" "}
                            {STATUS_LABELS[h.new_status as TicketStatus] ??
                              h.new_status}
                          </span>
                          <span className="mt-1 block text-[11px] text-[#4a4a6a]">
                            {timeAgo(h.changed_at as string)}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
                  <p className="text-sm font-medium text-[#a0a0b8]">
                    No activity yet
                  </p>
                  <p className="text-[13px] text-[#4a4a6a]">
                    Status changes on tickets will show up here.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ================= Quick actions ================= */}
          <section
            className="psd-in grid grid-cols-1 gap-4 lg:grid-cols-3"
            style={{ "--psd-delay": "0.2s" } as React.CSSProperties}
          >
            <ActionCard
              href="/tickets"
              icon={Ticket}
              tone="tickets"
              title="Tickets"
              desc="View and manage your support tickets."
              badges={[
                { label: `${activeCount} open`, tone: "open" as const },
                ...(urgentCount
                  ? [{ label: `${urgentCount} urgent`, tone: "urgent" as const }]
                  : []),
              ]}
            />

            {internal && (
              <>
                <ActionCard
                  href="/companies"
                  icon={Building2}
                  tone="companies"
                  title="Companies"
                  desc="Manage your client companies and their contacts."
                  badges={[
                    {
                      label: `${companiesCount} ${companiesCount === 1 ? "client" : "clients"}`,
                      tone: "new" as const,
                    },
                  ]}
                />
                <ActionCard
                  href="/team"
                  icon={Users}
                  tone="team"
                  title="Team"
                  desc="Add support reps to your agency."
                  badges={[
                    {
                      label: `${teamCount} ${teamCount === 1 ? "member" : "members"}`,
                      tone: "open" as const,
                    },
                  ]}
                />
              </>
            )}

            {isContact && companyName && (
              <ActionCard
                href="/contacts"
                icon={Users}
                tone="companies"
                title="Contacts"
                desc={`Add colleagues at ${companyName} who can raise tickets.`}
                badges={[]}
              />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

/* ---------- Stat card ---------- */

const STAT_TONES = {
  blue: "bg-[#6366f1]/[0.12] text-[#6366f1] shadow-[0_0_16px_rgba(99,102,241,0.1)]",
  green: "bg-[#22c55e]/[0.12] text-[#22c55e] shadow-[0_0_16px_rgba(34,197,94,0.1)]",
  amber: "bg-[#f59e0b]/[0.12] text-[#f59e0b] shadow-[0_0_16px_rgba(245,158,11,0.1)]",
  purple: "bg-[#8b5cf6]/[0.12] text-[#8b5cf6] shadow-[0_0_16px_rgba(139,92,246,0.1)]",
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  note,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: keyof typeof STAT_TONES;
  note: string;
}) {
  return (
    <div className="psd-card rounded-[20px] border border-white/[0.06] bg-[#16162e] p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6b6b8a]">
          {label}
        </span>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${STAT_TONES[tone]}`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
      </div>
      <div className="mb-1.5 text-[32px] font-bold leading-none tracking-[-0.03em]">
        {value}
      </div>
      <p className="text-[13px] text-[#6b6b8a]">{note}</p>
    </div>
  );
}

/* ---------- Action card ---------- */

const ACTION_TONES = {
  tickets: "bg-[#6366f1]/[0.12] text-[#6366f1] shadow-[0_0_20px_rgba(99,102,241,0.15)]",
  companies: "bg-[#8b5cf6]/[0.12] text-[#8b5cf6] shadow-[0_0_20px_rgba(139,92,246,0.15)]",
  team: "bg-[#22c55e]/[0.12] text-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.15)]",
};

const BADGE_TONES = {
  open: "bg-[#6366f1]/[0.12] text-[#6366f1]",
  urgent: "bg-[#ef4444]/[0.12] text-[#ef4444]",
  new: "bg-[#22c55e]/[0.12] text-[#22c55e]",
};

function ActionCard({
  href,
  icon: Icon,
  tone,
  title,
  desc,
  badges,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: keyof typeof ACTION_TONES;
  title: string;
  desc: string;
  badges: { label: string; tone: keyof typeof BADGE_TONES }[];
}) {
  return (
    <Link
      href={href}
      className="psd-card psd-action flex flex-col gap-3.5 rounded-[20px] border border-white/[0.06] bg-[#16162e] p-7"
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${ACTION_TONES[tone]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="psd-arrow flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] transition-all">
          <ArrowRight className="h-3.5 w-3.5 text-[#6b6b8a] transition-colors" strokeWidth={2} />
        </span>
      </div>
      <h3 className="text-base font-semibold text-[#f0f0f5]">{title}</h3>
      <p className="text-[13px] leading-relaxed text-[#6b6b8a]">{desc}</p>
      {badges.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {badges.map((b) => (
            <span
              key={b.label}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${BADGE_TONES[b.tone]}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

/* ---------- Helpers ---------- */

// Bucket raw created_at timestamps into one slot per day across the window,
// so days with no tickets still render as zero rather than being skipped.
function toDailyBuckets(
  timestamps: string[],
  start: Date,
  days: number,
): Bucket[] {
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const key = dayKey(new Date(ts));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return {
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: counts.get(dayKey(d)) ?? 0,
    };
  });
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// "2 minutes ago" / "3 hours ago" / "Jul 14" for anything older than a week.
function timeAgo(iso: string): string {
  const then = new Date(iso);
  const mins = Math.floor((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
