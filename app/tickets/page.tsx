import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, SlidersHorizontal, Ticket as TicketIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { initials, avatarGradient } from "@/components/dashboard/avatar";
import { isInternal, roleLabel, INTERNAL_ROLES } from "@/lib/roles";
import {
  STATUS_LABELS,
  STATUS_OPTIONS,
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  DARK_STATUS_STYLES,
  DARK_PRIORITY_STYLES,
  formatDateTime,
  type TicketStatus,
  type TicketPriority,
} from "@/lib/tickets";
import "@/components/dashboard/dark.css";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; assignee?: string }>;
}) {
  const { status, priority, assignee } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Who is looking? Only internal staff get the assignee filter + column.
  const { data: me } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();
  const internal = isInternal(me?.role);

  // The agency's staff, for the assignee dropdown and to label ticket rows.
  const { data: reps } = internal
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", INTERNAL_ROLES)
        .order("full_name", { ascending: true })
    : { data: null };
  const repList = (reps ?? []).map((r) => ({
    id: r.id,
    name: r.full_name || r.email || "Unnamed",
  }));

  // Only treat a filter as active if it's a valid value (ignore junk in the URL).
  const activeStatus = STATUS_OPTIONS.includes(status as TicketStatus)
    ? (status as TicketStatus)
    : null;
  const activePriority = PRIORITY_OPTIONS.includes(priority as TicketPriority)
    ? (priority as TicketPriority)
    : null;
  // Assignee filter (internal only): "me", "unassigned", or a valid rep id.
  const activeAssignee =
    internal &&
    (assignee === "me" ||
      assignee === "unassigned" ||
      repList.some((r) => r.id === assignee))
      ? assignee
      : null;

  // RLS scopes this to the user's org (and, for company contacts, to their
  // own client company's tickets).
  let query = supabase
    .from("tickets")
    .select("id, subject, status, priority, created_at, assigned_agent_id, companies(name)")
    .order("created_at", { ascending: false });

  if (activeStatus) query = query.eq("status", activeStatus);
  if (activePriority) query = query.eq("priority", activePriority);
  if (activeAssignee === "me") query = query.eq("assigned_agent_id", user.id);
  else if (activeAssignee === "unassigned")
    query = query.is("assigned_agent_id", null);
  else if (activeAssignee) query = query.eq("assigned_agent_id", activeAssignee);

  const { data: tickets } = await query;
  const hasFilter = activeStatus || activePriority || activeAssignee;
  const count = tickets?.length ?? 0;

  return (
    <div className="psd-shell min-h-screen bg-[#0a0a1a] font-[family-name:var(--font-inter)] text-[#f0f0f5] antialiased">
      <div className="relative z-[1]">
        <DashboardNav
          name={me?.full_name || me?.email || user.email || "there"}
          role={roleLabel(me?.role)}
          internal={internal}
          isContact={me?.role === "company_contact"}
          current="tickets"
        />

        <main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
          {/* ================= Header ================= */}
          <section
            className="psd-in mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
            style={{ "--psd-delay": "0.05s" } as React.CSSProperties}
          >
            <div>
              <h1 className="psd-title text-[28px] font-bold leading-tight tracking-[-0.025em] sm:text-[32px]">
                Tickets
              </h1>
              <p className="mt-1.5 text-[15px] text-[#a0a0b8]">
                {count} {count === 1 ? "ticket" : "tickets"}
                {hasFilter ? " matching your filters" : " in view"}
              </p>
            </div>
            <Link
              href="/tickets/new"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              New ticket
            </Link>
          </section>

          {/* ================= Filters ================= */}
          {/* Still a plain GET form, so filters stay in the URL and the page
              keeps working without client JS. */}
          <form
            method="GET"
            className="psd-in mb-6 flex flex-col gap-4 rounded-[20px] border border-white/[0.06] bg-[#16162e] p-6 sm:flex-row sm:flex-wrap sm:items-end"
            style={{ "--psd-delay": "0.1s" } as React.CSSProperties}
          >
            <FilterSelect
              name="status"
              label="Status"
              defaultValue={activeStatus ?? ""}
              allLabel="All statuses"
              options={STATUS_OPTIONS.map((s) => ({
                value: s,
                label: STATUS_LABELS[s],
              }))}
            />
            <FilterSelect
              name="priority"
              label="Priority"
              defaultValue={activePriority ?? ""}
              allLabel="All priorities"
              options={PRIORITY_OPTIONS.map((p) => ({
                value: p,
                label: PRIORITY_LABELS[p],
              }))}
            />
            {internal && (
              <FilterSelect
                name="assignee"
                label="Assignee"
                defaultValue={activeAssignee ?? ""}
                allLabel="Anyone"
                options={[
                  { value: "me", label: "Assigned to me" },
                  { value: "unassigned", label: "Unassigned" },
                  ...repList.map((r) => ({ value: r.id, label: r.name })),
                ]}
              />
            )}

            <div className="flex items-center gap-3 sm:ml-auto">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#f0f0f5] px-6 py-2.5 text-sm font-semibold text-[#0a0a1a] transition-all hover:-translate-y-px hover:opacity-90"
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={2.2} />
                Apply
              </button>
              {hasFilter && (
                <Link
                  href="/tickets"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#6b6b8a] transition-colors hover:text-[#f0f0f5]"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>

          {/* ================= Table ================= */}
          <section
            className="psd-in"
            style={{ "--psd-delay": "0.15s" } as React.CSSProperties}
          >
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/[0.08] bg-[#16162e] px-6 py-16 text-center">
                <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366f1]/[0.12] text-[#6366f1]">
                  <TicketIcon className="h-5 w-5" strokeWidth={2} />
                </span>
                <p className="text-[15px] font-semibold text-[#f0f0f5]">
                  {hasFilter ? "No tickets match these filters" : "No tickets yet"}
                </p>
                <p className="mb-4 text-[13px] text-[#6b6b8a]">
                  {hasFilter
                    ? "Try widening the filters, or clear them to see everything."
                    : "Once a ticket is raised it'll appear here."}
                </p>
                {hasFilter ? (
                  <Link
                    href="/tickets"
                    className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-[#a0a0b8] transition-colors hover:border-white/[0.12] hover:bg-white/[0.08] hover:text-[#f0f0f5]"
                  >
                    Clear filters
                  </Link>
                ) : (
                  <Link
                    href="/tickets/new"
                    className="rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)] transition-all hover:-translate-y-px"
                  >
                    Create your first ticket
                  </Link>
                )}
              </div>
            ) : (
              <div className="psd-panel overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#16162e]">
                <table className="psd-table w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <Th>Ticket</Th>
                      <Th>Priority</Th>
                      <Th>Status</Th>
                      {internal && <Th>Assignee</Th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(tickets ?? []).map((t) => {
                      const company = (t.companies as { name?: string } | null)?.name;
                      const rep = repList.find((r) => r.id === t.assigned_agent_id);
                      return (
                        <tr
                          key={t.id}
                          className="psd-row border-b border-white/[0.06] last:border-b-0"
                        >
                          <Td label="Ticket">
                            {/* The link fills the title cell; the whole row
                                highlights on hover to signal it's clickable. */}
                            <Link href={`/tickets/${t.id}`} className="block">
                              <span className="block text-[15px] font-semibold text-[#f0f0f5]">
                                {t.subject}
                              </span>
                              <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#6b6b8a]">
                                {company && (
                                  <>
                                    <span className="font-medium text-[#a78bfa]">
                                      {company}
                                    </span>
                                    <Dot />
                                  </>
                                )}
                                {formatDateTime(t.created_at)}
                              </span>
                            </Link>
                          </Td>
                          <Td label="Priority">
                            <Badge
                              text={PRIORITY_LABELS[t.priority as TicketPriority]}
                              className={
                                DARK_PRIORITY_STYLES[t.priority as TicketPriority]
                              }
                            />
                          </Td>
                          <Td label="Status">
                            <Badge
                              text={STATUS_LABELS[t.status as TicketStatus]}
                              className={DARK_STATUS_STYLES[t.status as TicketStatus]}
                            />
                          </Td>
                          {internal && (
                            <Td label="Assignee">
                              {rep ? (
                                <span className="flex items-center gap-2.5">
                                  <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarGradient(rep.id)}`}
                                  >
                                    {initials(rep.name)}
                                  </span>
                                  <span className="text-sm font-medium text-[#a0a0b8]">
                                    {rep.name}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-sm text-[#4a4a6a]">
                                  Unassigned
                                </span>
                              )}
                            </Td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-6 py-4">
                  <p className="text-[13px] text-[#6b6b8a]">
                    Showing <strong className="font-semibold text-[#f0f0f5]">{count}</strong>{" "}
                    {count === 1 ? "ticket" : "tickets"}
                  </p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

/* ---------- Filter select ---------- */

function FilterSelect({
  name,
  label,
  defaultValue,
  allLabel,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  /* Label for the empty value — i.e. "no filter applied". */
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex min-w-[180px] flex-col gap-2">
      <label
        htmlFor={name}
        className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6b8a]"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="psd-select w-full cursor-pointer rounded-xl border border-white/[0.06] bg-[#11112a] py-2.5 pl-3.5 pr-9 text-sm text-[#f0f0f5] outline-none"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------- Table primitives ---------- */

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6b8a]">
      {children}
    </th>
  );
}

// `data-label` drives the stacked-card layout on narrow screens (see dark.css).
function Td({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <td data-label={label} className="px-6 py-5 align-middle">
      {children}
    </td>
  );
}

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {text}
    </span>
  );
}

function Dot() {
  return <span className="h-[3px] w-[3px] rounded-full bg-[#4a4a6a]" />;
}
