import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Mail,
  Sparkles,
  Ticket as TicketIcon,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { initials, avatarGradient } from "@/components/dashboard/avatar";
import ReplyForm from "./ReplyForm";
import SuggestedStatus from "./SuggestedStatus";
import StatusControl from "./StatusControl";
import AssignControl from "./AssignControl";
import TimeControl from "./TimeControl";
import { isInternal, roleLabel, INTERNAL_ROLES } from "@/lib/roles";
import {
  STATUS_LABELS,
  STATUS_OPTIONS,
  DARK_STATUS_STYLES,
  PRIORITY_LABELS,
  DARK_PRIORITY_STYLES,
  formatDateTime,
  formatMinutes,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/tickets";
import "@/components/dashboard/dark.css";

// Dot colour for a related ticket, keyed off its status.
const STATUS_DOTS: Record<TicketStatus, string> = {
  open: "bg-[#6366f1] shadow-[0_0_6px_rgba(99,102,241,0.4)]",
  in_progress: "bg-[#f59e0b] shadow-[0_0_6px_rgba(245,158,11,0.4)]",
  waiting_on_client: "bg-[#8b5cf6] shadow-[0_0_6px_rgba(139,92,246,0.4)]",
  testing: "bg-[#06b6d4] shadow-[0_0_6px_rgba(6,182,212,0.4)]",
  resolved: "bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.4)]",
  closed: "bg-[#4a4a6a]",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load the ticket, the current user's role, and the message thread together.
  // RLS ensures a user can only load a ticket they're allowed to see.
  const [{ data: ticket }, { data: profile }, { data: messages }, { data: reps }] =
    await Promise.all([
      supabase
        .from("tickets")
        .select(
          "id, subject, description, status, priority, created_at, ai_summary, category, ai_suggested_tags, assigned_agent_id, client_id, company_id, time_spent_minutes, companies(name)",
        )
        .eq("id", id)
        .single(),
      supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", user.id)
        .single(),
      supabase
        .from("ticket_messages")
        .select("id, body, sender_role, created_at, is_ai_drafted")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", INTERNAL_ROLES)
        .order("full_name", { ascending: true }),
    ]);

  if (!ticket) notFound();

  const internal = isInternal(profile?.role);
  const companyName =
    (ticket.companies as { name?: string } | null)?.name ?? null;
  const companyId = ticket.company_id as string | null;

  // A pending "looks resolved" suggestion, shown to internal staff only — the
  // client shouldn't see the system second-guessing their own ticket. Ignored
  // once the status has moved on, so a stale row can't resurface it.
  //
  // Read separately and tolerantly: migration 0008 adds this column, and a
  // ticket must still render on a database where that hasn't been applied.
  // Folding it into the select above would turn a missing column into a 404.
  let suggestedStatus: TicketStatus | null = null;
  if (internal) {
    const { data: suggestion } = await supabase
      .from("tickets")
      .select("ai_suggested_status")
      .eq("id", id)
      .single();
    const raw = suggestion?.ai_suggested_status as string | null | undefined;
    if (raw && raw !== ticket.status && STATUS_OPTIONS.includes(raw as TicketStatus)) {
      suggestedStatus = raw as TicketStatus;
    }
  }

  // Read-only sidebar data: who reported this, and the company's other tickets.
  // Both are plain selects — separate from the ticket query because `tickets`
  // has two foreign keys into `profiles` and the embed would be ambiguous.
  const [{ data: reporter }, { data: related }] = await Promise.all([
    ticket.client_id
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", ticket.client_id)
          .single()
      : Promise.resolve({ data: null }),
    companyId
      ? supabase
          .from("tickets")
          .select("id, subject, status")
          .eq("company_id", companyId)
          .neq("id", id)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null }),
  ]);

  // Support reps who can own this ticket, plus the current assignee's name.
  const repList = (reps ?? []).map((r) => ({
    id: r.id,
    name: r.full_name || r.email || "Unnamed",
  }));
  const assignee = repList.find((r) => r.id === ticket.assigned_agent_id) ?? null;
  const timeSpent = (ticket.time_spent_minutes as number) ?? 0;
  const reporterName = reporter?.full_name || reporter?.email || null;

  return (
    <div className="psd-shell min-h-screen bg-[#0a0a1a] font-[family-name:var(--font-inter)] text-[#f0f0f5] antialiased">
      <div className="relative z-[1]">
        <DashboardNav
          name={profile?.full_name || profile?.email || user.email || "there"}
          role={roleLabel(profile?.role)}
          internal={internal}
          isContact={profile?.role === "company_contact"}
          current="tickets"
        />

        <main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
          <Link
            href="/tickets"
            className="psd-in inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6b6b8a] transition-colors hover:text-[#f0f0f5]"
            style={{ "--psd-delay": "0.05s" } as React.CSSProperties}
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
            Back to tickets
          </Link>

          {/* ================= Ticket header ================= */}
          <section
            className="psd-in mb-7 mt-4"
            style={{ "--psd-delay": "0.08s" } as React.CSSProperties}
          >
            <div className="mb-2 flex flex-wrap items-center gap-4">
              <h1 className="psd-title text-[26px] font-bold leading-tight tracking-[-0.025em] sm:text-[32px]">
                {ticket.subject}
              </h1>
              <div className="flex gap-2">
                <Badge
                  text={PRIORITY_LABELS[ticket.priority as TicketPriority]}
                  className={DARK_PRIORITY_STYLES[ticket.priority as TicketPriority]}
                />
                <Badge
                  text={STATUS_LABELS[ticket.status as TicketStatus]}
                  className={DARK_STATUS_STYLES[ticket.status as TicketStatus]}
                />
              </div>
            </div>

            <p className="text-sm text-[#6b6b8a]">
              {companyName &&
                (internal && companyId ? (
                  <>
                    <Link
                      href={`/companies/${companyId}`}
                      className="text-[#a78bfa] hover:underline"
                    >
                      {companyName}
                    </Link>
                    {" · "}
                  </>
                ) : (
                  <>
                    <span className="text-[#a0a0b8]">{companyName}</span>
                    {" · "}
                  </>
                ))}
              Opened {formatDateTime(ticket.created_at)}
              {internal && (
                <>
                  {" · "}
                  {assignee ? (
                    <>
                      Assigned to{" "}
                      <span className="text-[#a78bfa]">{assignee.name}</span>
                    </>
                  ) : (
                    "Unassigned"
                  )}
                  {timeSpent > 0 && ` · ${formatMinutes(timeSpent)} logged`}
                </>
              )}
            </p>
          </section>

          {/* ================= Two column ================= */}
          <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-[1fr_320px]">
            {/* ---------- Left: request, AI, conversation, reply ---------- */}
            <div className="flex flex-col gap-6">
              {/* 1. The client's original request */}
              <div
                className="psd-in psd-panel rounded-[20px] border border-white/[0.06] bg-[#16162e] p-7"
                style={{ "--psd-delay": "0.1s" } as React.CSSProperties}
              >
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b6b8a]">
                  Original Request
                </p>
                {ticket.description ? (
                  <p className="whitespace-pre-wrap text-[15px] leading-[1.7] text-[#a0a0b8]">
                    {ticket.description}
                  </p>
                ) : (
                  <p className="text-[15px] italic text-[#4a4a6a]">
                    No description provided.
                  </p>
                )}
              </div>

              {/* 2. AI summary — shown once triage has run on this ticket */}
              {ticket.ai_summary && (
                <div
                  className="psd-in psd-ai rounded-[20px] border border-[#8b5cf6]/[0.15] p-7"
                  style={{ "--psd-delay": "0.13s" } as React.CSSProperties}
                >
                  <div className="mb-3.5 flex items-center gap-2.5">
                    <Sparkles className="h-[18px] w-[18px] text-[#a78bfa]" strokeWidth={2.2} />
                    <span className="text-[15px] font-bold text-[#a78bfa]">
                      AI summary
                    </span>
                    {ticket.category && (
                      <span className="ml-auto rounded-full bg-[#8b5cf6]/[0.12] px-3 py-1 text-[11px] font-semibold text-[#a78bfa]">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-[1.7] text-[#a0a0b8]">
                    {ticket.ai_summary}
                  </p>
                  {Array.isArray(ticket.ai_suggested_tags) &&
                    ticket.ai_suggested_tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {ticket.ai_suggested_tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#8b5cf6]/[0.15] bg-[#8b5cf6]/[0.08] px-3 py-1.5 text-xs font-medium text-[#a78bfa]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Conversation */}
              <div
                className="psd-in mt-2"
                style={{ "--psd-delay": "0.16s" } as React.CSSProperties}
              >
                <h2 className="mb-4 text-sm font-bold tracking-[0.02em] text-[#f0f0f5]">
                  Conversation
                </h2>

                {messages && messages.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {messages.map((m) => {
                      const who = roleLabel(m.sender_role);
                      return (
                        <div
                          key={m.id}
                          className="psd-panel rounded-[20px] border border-white/[0.06] bg-[#16162e] px-6 py-5"
                        >
                          <div className="mb-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarGradient(m.sender_role ?? "unknown")}`}
                              >
                                {initials(who)}
                              </span>
                              <span className="text-[13px] font-semibold text-[#f0f0f5]">
                                {who}
                              </span>
                              {m.is_ai_drafted && (
                                <span className="flex items-center gap-1 rounded-full bg-[#8b5cf6]/[0.12] px-2 py-0.5 text-[10px] font-semibold text-[#a78bfa]">
                                  <Sparkles className="h-2.5 w-2.5" strokeWidth={2.4} />
                                  AI drafted
                                </span>
                              )}
                            </div>
                            <span className="shrink-0 text-[11px] text-[#4a4a6a]">
                              {formatDateTime(m.created_at)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap pl-[42px] text-sm leading-relaxed text-[#a0a0b8]">
                            {m.body}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-[20px] border border-dashed border-white/[0.08] bg-[#16162e] px-6 py-10 text-center text-sm text-[#4a4a6a]">
                    No replies yet.
                  </p>
                )}
              </div>

              {/* 4. Reply box */}
              <div
                className="psd-in"
                style={{ "--psd-delay": "0.19s" } as React.CSSProperties}
              >
                <ReplyForm ticketId={ticket.id} viewerRole={profile?.role} />
              </div>
            </div>

            {/* ---------- Right: sticky sidebar ---------- */}
            <aside className="flex flex-col gap-6 xl:sticky xl:top-[84px]">
              {/* Properties — internal staff only */}
              {internal && (
                <div
                  className="psd-in psd-panel rounded-[20px] border border-white/[0.06] bg-[#16162e] p-6"
                  style={{ "--psd-delay": "0.1s" } as React.CSSProperties}
                >
                  <h3 className="mb-5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#6b6b8a]">
                    Properties
                  </h3>
                  <div className="border-b border-white/[0.06] pb-4">
                    {/* The AI's read on the client's last reply — a proposal
                        sitting above the control that actually decides. */}
                    {suggestedStatus && (
                      <SuggestedStatus
                        ticketId={ticket.id}
                        suggested={suggestedStatus}
                      />
                    )}
                    <StatusControl
                      ticketId={ticket.id}
                      current={ticket.status as TicketStatus}
                    />
                  </div>
                  <div className="border-b border-white/[0.06] py-4">
                    <AssignControl
                      ticketId={ticket.id}
                      current={ticket.assigned_agent_id as string | null}
                      reps={repList}
                    />
                  </div>
                  <div className="pt-4">
                    <TimeControl ticketId={ticket.id} totalMinutes={timeSpent} />
                  </div>
                </div>
              )}

              {/* Ticket details */}
              <div
                className="psd-in psd-panel rounded-[20px] border border-white/[0.06] bg-[#16162e] p-6"
                style={{ "--psd-delay": "0.13s" } as React.CSSProperties}
              >
                <h3 className="mb-4 text-[13px] font-bold uppercase tracking-[0.08em] text-[#6b6b8a]">
                  Ticket Details
                </h3>
                <SidebarItem
                  icon={CalendarDays}
                  label="Created"
                  value={formatDateTime(ticket.created_at)}
                />
                {internal && (
                  <SidebarItem
                    icon={Clock}
                    label="Time logged"
                    value={formatMinutes(timeSpent)}
                  />
                )}
                {reporterName && (
                  <SidebarItem
                    icon={UserRound}
                    label="Reporter"
                    value={reporterName}
                  />
                )}
                <SidebarItem
                  icon={TicketIcon}
                  label="Ticket ID"
                  value={`#${ticket.id.slice(0, 8)}`}
                />
              </div>

              {/* Company */}
              {companyName && (
                <div
                  className="psd-in psd-panel rounded-[20px] border border-white/[0.06] bg-[#16162e] p-6"
                  style={{ "--psd-delay": "0.16s" } as React.CSSProperties}
                >
                  <h3 className="mb-4 text-[13px] font-bold uppercase tracking-[0.08em] text-[#6b6b8a]">
                    Company
                  </h3>
                  <div className="flex items-center gap-3 border-b border-white/[0.06] pb-2.5">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarGradient(companyId ?? companyName)}`}
                    >
                      {companyName.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[11px] text-[#6b6b8a]">Name</p>
                      <p className="truncate text-[13px] font-semibold text-[#f0f0f5]">
                        {internal && companyId ? (
                          <Link
                            href={`/companies/${companyId}`}
                            className="text-[#a78bfa] hover:underline"
                          >
                            {companyName}
                          </Link>
                        ) : (
                          companyName
                        )}
                      </p>
                    </div>
                  </div>
                  {reporter?.email && (
                    <SidebarItem icon={Mail} label="Contact" value={reporter.email} />
                  )}
                </div>
              )}

              {/* Related tickets — same company */}
              {related && related.length > 0 && (
                <div
                  className="psd-in psd-panel rounded-[20px] border border-white/[0.06] bg-[#16162e] p-6"
                  style={{ "--psd-delay": "0.19s" } as React.CSSProperties}
                >
                  <h3 className="mb-4 text-[13px] font-bold uppercase tracking-[0.08em] text-[#6b6b8a]">
                    Related Tickets
                  </h3>
                  {related.map((r, i) => (
                    <Link
                      key={r.id}
                      href={`/tickets/${r.id}`}
                      className={`-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-white/[0.02] ${
                        i ? "border-t border-white/[0.06]" : ""
                      }`}
                    >
                      <span className="shrink-0 font-mono text-xs font-bold text-[#a78bfa]">
                        #{r.id.slice(0, 4)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[#a0a0b8]">
                        {r.subject}
                      </span>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOTS[r.status as TicketStatus]}`}
                        title={STATUS_LABELS[r.status as TicketStatus]}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Pieces ---------- */

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold ${className}`}
    >
      {text}
    </span>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] py-2.5 first:pt-0 last:border-b-0 last:pb-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8b5cf6]/[0.08] text-[#a78bfa]">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[11px] text-[#6b6b8a]">{label}</p>
        <p className="truncate text-[13px] font-semibold text-[#f0f0f5]">{value}</p>
      </div>
    </div>
  );
}
