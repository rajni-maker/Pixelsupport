import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, Plus, Ticket, UserRound, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { initials, avatarGradient } from "@/components/dashboard/avatar";
import { isInternal, roleLabel, INTERNAL_ROLES } from "@/lib/roles";
import {
  STATUS_LABELS,
  DARK_STATUS_STYLES,
  PRIORITY_LABELS,
  DARK_PRIORITY_STYLES,
  formatDateTime,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/tickets";
import InviteContactForm from "./InviteContactForm";
import "@/components/dashboard/dark.css";

// A ticket is "active" until it's been resolved or closed.
const CLOSED_STATUSES = ["resolved", "closed"];

export default async function CompanyDetailPage({
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

  const { data: me } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();
  if (!isInternal(me?.role)) redirect("/dashboard");

  // The company (RLS-scoped to the agency), its contacts, this client's
  // tickets, and the agency staff (to name assignees). All read-only.
  const [{ data: company }, { data: contacts }, { data: tickets }, { data: reps }] =
    await Promise.all([
      supabase.from("companies").select("id, name").eq("id", id).single(),
      supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .eq("company_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("tickets")
        .select("id, subject, status, priority, created_at, assigned_agent_id")
        .eq("company_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", INTERNAL_ROLES),
    ]);

  if (!company) notFound();

  const contactCount = contacts?.length ?? 0;

  // Counts are derived from the same rows the list renders, so the chips can
  // never disagree with what's shown below them. Both respect RLS: an admin
  // sees the whole company's tickets, a rep only their own plus unassigned.
  const ticketRows = tickets ?? [];
  const totalCount = ticketRows.length;
  const openCount = ticketRows.filter(
    (t) => !CLOSED_STATUSES.includes(t.status as string),
  ).length;

  const repName = new Map(
    (reps ?? []).map((r) => [r.id, r.full_name || r.email || "Unnamed"]),
  );

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
              href="/companies"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6b6b8a] transition-colors hover:text-[#f0f0f5]"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
              Back to companies
            </Link>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#8b5cf6]/[0.12] text-[#8b5cf6] shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                  <Building2 className="h-6 w-6" strokeWidth={2} />
                </span>
                <div>
                  <h1 className="psd-title text-[28px] font-bold leading-tight tracking-[-0.025em] sm:text-[32px]">
                    {company.name}
                  </h1>
                  <p className="mt-1 text-[15px] text-[#a0a0b8]">
                    Contacts here can create and reply to tickets.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  icon={Users}
                  text={`${contactCount} ${contactCount === 1 ? "contact" : "contacts"}`}
                  tone="indigo"
                />
                <Chip
                  icon={Ticket}
                  text={`${openCount} open`}
                  tone={openCount ? "amber" : "muted"}
                />
                <Chip
                  icon={Ticket}
                  text={`${totalCount} total`}
                  tone="muted"
                />
              </div>
            </div>
          </section>

          {/* Tickets carry the weight, so they take the wide column; the
              people-management side sits together on the right. */}
          <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-[1fr_380px]">
          {/* ================= Tickets ================= */}
          <section
            className="psd-in"
            style={{ "--psd-delay": "0.1s" } as React.CSSProperties}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[17px] font-bold tracking-[-0.01em]">
                Tickets
              </h2>
              <div className="flex items-center gap-4">
                {totalCount > 0 && (
                  <Link
                    href="/tickets"
                    className="text-[13px] font-medium text-[#6b6b8a] transition-colors hover:text-[#a78bfa]"
                  >
                    All tickets →
                  </Link>
                )}
                {/* Raise one on the client's behalf — the company comes prefilled. */}
                <Link
                  href={`/tickets/new?company=${company.id}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)]"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.4} />
                  New ticket
                </Link>
              </div>
            </div>

            {totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/[0.08] bg-[#16162e] px-6 py-14 text-center">
                <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366f1]/[0.12] text-[#6366f1]">
                  <Ticket className="h-5 w-5" strokeWidth={2} />
                </span>
                <p className="text-[15px] font-semibold text-[#f0f0f5]">
                  No tickets from this company yet
                </p>
                <p className="text-[13px] text-[#6b6b8a]">
                  Anything they raise will show up here.
                </p>
                <Link
                  href={`/tickets/new?company=${company.id}`}
                  className="mt-3 flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)]"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.4} />
                  New ticket
                </Link>
              </div>
            ) : (
              <div className="psd-panel overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#16162e]">
                {ticketRows.map((t, i) => {
                  const assignee = t.assigned_agent_id
                    ? repName.get(t.assigned_agent_id as string)
                    : null;
                  return (
                    <Link
                      key={t.id}
                      href={`/tickets/${t.id}`}
                      className={`psd-row group flex flex-col gap-3 px-7 py-5 sm:flex-row sm:items-center sm:justify-between ${
                        i ? "border-t border-white/[0.06]" : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold text-[#f0f0f5]">
                          {t.subject}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6b6b8a]">
                          {formatDateTime(t.created_at)}
                          <span className="h-[3px] w-[3px] rounded-full bg-[#4a4a6a]" />
                          {assignee ?? "Unassigned"}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${DARK_PRIORITY_STYLES[t.priority as TicketPriority]}`}
                        >
                          {PRIORITY_LABELS[t.priority as TicketPriority]}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${DARK_STATUS_STYLES[t.status as TicketStatus]}`}
                        >
                          {STATUS_LABELS[t.status as TicketStatus]}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* ================= People (right column) ================= */}
          <aside className="flex flex-col gap-8">
          <section
            className="psd-in"
            style={{ "--psd-delay": "0.13s" } as React.CSSProperties}
          >
            <h2 className="mb-4 text-[17px] font-bold tracking-[-0.01em]">
              Contacts
            </h2>

            {contactCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/[0.08] bg-[#16162e] px-6 py-14 text-center">
                <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366f1]/[0.12] text-[#6366f1]">
                  <UserRound className="h-5 w-5" strokeWidth={2} />
                </span>
                <p className="text-[15px] font-semibold text-[#f0f0f5]">
                  No contacts yet
                </p>
                <p className="text-[13px] text-[#6b6b8a]">
                  Invite the first one below so they can raise tickets.
                </p>
              </div>
            ) : (
              <div className="psd-panel overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#16162e]">
                {(contacts ?? []).map((c, i) => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-3.5 px-6 py-4 ${
                      i ? "border-t border-white/[0.06]" : ""
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${avatarGradient(c.id)}`}
                    >
                      {initials(c.full_name || c.email || "?")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#f0f0f5]">
                        {c.full_name || c.email}
                      </p>
                      <p className="truncate text-xs text-[#6b6b8a]">{c.email}</p>
                    </div>
                    {/* Dropped the "Added <date>" column here — it doesn't fit
                        the narrow panel; the date still shows on /contacts. */}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ================= Invite ================= */}
          <section
            className="psd-in"
            style={{ "--psd-delay": "0.15s" } as React.CSSProperties}
          >
            <h2 className="mb-4 text-[17px] font-bold tracking-[-0.01em]">
              Invite a contact
            </h2>
            <InviteContactForm companyId={company.id} />
          </section>
          </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

const CHIP_TONES = {
  indigo: "bg-[#6366f1]/[0.12] text-[#818cf8]",
  amber: "bg-[#f59e0b]/[0.12] text-[#fbbf24]",
  muted: "bg-white/[0.06] text-[#a0a0b8]",
};

function Chip({
  icon: Icon,
  text,
  tone,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  text: string;
  tone: keyof typeof CHIP_TONES;
}) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${CHIP_TONES[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      {text}
    </span>
  );
}

