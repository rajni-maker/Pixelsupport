// Slack notifications via an incoming webhook (no SDK dependency).
//
// Best-effort and self-guarding, exactly like lib/email.ts: if
// SLACK_WEBHOOK_URL is unset the functions are silent no-ops, and network
// errors are swallowed. A Slack outage must never break a ticket action.
//
// Only three events post here, by design:
//   1. a new ticket is created
//   2. a ticket is assigned to a support rep
//   3. a customer (company contact) replies
// Internal replies and status changes stay in email only, to keep the channel
// signal-heavy.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type Block = Record<string, unknown>;

async function post(text: string, blocks: Block[]) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `text` is the notification/fallback string shown in the sidebar and
      // on mobile push; `blocks` render the formatted message in-channel.
      body: JSON.stringify({ text, blocks }),
    });
    // Slack replies "ok" on success and a plain-text reason on failure
    // (invalid_payload, channel_not_found, ...). Log it rather than swallow.
    if (!res.ok) {
      console.error(`[slack] ${res.status}:`, (await res.text()).slice(0, 200));
    }
  } catch (err) {
    // best-effort — never surface Slack failures to the user
    console.error("[slack] network error:", err);
  }
}

// Slack's mrkdwn treats these three characters specially, so escape any text
// that came from a user (ticket subjects, names, reply bodies).
function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
  );
}

// Reply bodies can be long; keep the channel readable.
function truncate(s: string, max = 300): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

// Shared message shape: a headline, optional context lines, and a button
// through to the ticket.
function build(
  headline: string,
  fields: { label: string; value: string }[],
  path: string,
  buttonLabel: string,
): Block[] {
  const blocks: Block[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: `*${headline}*` },
    },
  ];

  if (fields.length) {
    blocks.push({
      type: "section",
      fields: fields.map((f) => ({
        type: "mrkdwn",
        text: `*${f.label}*\n${f.value}`,
      })),
    });
  }

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: buttonLabel, emoji: true },
        url: `${SITE_URL}${path}`,
      },
    ],
  });

  return blocks;
}

// ---- 1. New ticket created ------------------------------------------------

export async function slackNewTicket(opts: {
  ticketId: string;
  subject: string;
  companyName?: string | null;
  priority: string;
  createdBy: string;
}) {
  const subject = esc(opts.subject);
  await post(
    `New ticket: ${subject}`,
    build(
      `🎫 New ticket — ${subject}`,
      [
        { label: "Company", value: esc(opts.companyName || "—") },
        { label: "Priority", value: esc(opts.priority) },
        { label: "Raised by", value: esc(opts.createdBy) },
      ],
      `/tickets/${opts.ticketId}`,
      "Open ticket",
    ),
  );
}

// ---- 2. Ticket assigned to a support rep ----------------------------------

export async function slackTicketAssigned(opts: {
  ticketId: string;
  subject: string;
  assigneeName: string;
  assignedByName: string;
}) {
  const subject = esc(opts.subject);
  await post(
    `${esc(opts.assigneeName)} was assigned: ${subject}`,
    build(
      `👤 Ticket assigned — ${subject}`,
      [
        { label: "Assigned to", value: esc(opts.assigneeName) },
        { label: "Assigned by", value: esc(opts.assignedByName) },
      ],
      `/tickets/${opts.ticketId}`,
      "Open ticket",
    ),
  );
}

// ---- 3. Customer reply received -------------------------------------------

export async function slackCustomerReply(opts: {
  ticketId: string;
  subject: string;
  fromName: string;
  companyName?: string | null;
  body: string;
}) {
  const subject = esc(opts.subject);
  const blocks = build(
    `💬 Customer reply — ${subject}`,
    [
      { label: "From", value: esc(opts.fromName) },
      { label: "Company", value: esc(opts.companyName || "—") },
    ],
    `/tickets/${opts.ticketId}`,
    "Reply in PixelSupport",
  );

  // Quote the reply itself between the fields and the button.
  blocks.splice(2, 0, {
    type: "section",
    text: { type: "mrkdwn", text: `>${esc(truncate(opts.body))}` },
  });

  await post(`Customer reply on: ${subject}`, blocks);
}
