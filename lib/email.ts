// Outbound email via Resend's REST API (no SDK dependency).
//
// Best-effort and self-guarding: if RESEND_API_KEY is unset, or there are no
// recipients, every function is a silent no-op — email must never break an
// action. Errors are swallowed for the same reason.
//
// NOTE: with no verified domain, Resend only delivers from onboarding@resend.dev
// and only to your own account email. To email real recipients, verify a
// sending domain in Resend and set EMAIL_FROM.

const FROM = process.env.EMAIL_FROM || "PixelSupport <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function send(to: string[], subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  let recipients = [...new Set(to.filter(Boolean))];

  // Test mode: without a verified domain (EMAIL_FROM unset) Resend only
  // accepts the account owner's address — and rejects the WHOLE request if any
  // other recipient is present, so one teammate's address silently killed the
  // admin's copy too. Redirect everything to the admin instead, and note who
  // it was really for, so notifications still demo end-to-end.
  const testMode = !process.env.EMAIL_FROM;
  const admin = process.env.ADMIN_ALERT_EMAIL;
  if (testMode && admin) {
    const intended = recipients.filter((r) => r !== admin);
    if (intended.length) {
      html =
        `<p style="margin:0 0 12px;padding:8px 12px;background:#FEF3C7;border-radius:6px;color:#92400E;font-size:12px">` +
        `Test mode — this would have gone to: ${esc(intended.join(", "))}. ` +
        `Verify a domain in Resend and set EMAIL_FROM to deliver for real.</p>` +
        html;
    }
    recipients = [admin];
  }

  // Still best-effort — but log why nothing was sent, otherwise a missing key
  // or an empty recipient list is indistinguishable from a delivered email.
  if (!key) {
    console.warn("[email] skipped: RESEND_API_KEY is not set —", subject);
    return;
  }
  if (recipients.length === 0) {
    console.warn("[email] skipped: no recipients —", subject);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: recipients, subject, html }),
    });

    // Resend answers 4xx with a JSON error (unverified domain, invalid
    // recipient, ...). Without this check a rejected send looked identical to
    // a successful one, which is why failures were invisible.
    if (!res.ok) {
      console.error(
        `[email] Resend ${res.status} sending "${subject}" to ${recipients.join(", ")}:`,
        (await res.text()).slice(0, 400),
      );
    }
  } catch (err) {
    console.error("[email] network error sending", subject, err);
  }
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
  );
}

// A simple, clean notification email: heading, some lines, and a call-to-action
// link. `path` is app-relative (e.g. "/tickets/123" or "/team").
function wrap(
  heading: string,
  lines: string[],
  path: string,
  linkLabel: string,
): string {
  const link = `${SITE_URL}${path}`;
  const body = lines
    .map(
      (l) =>
        `<p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.5">${l}</p>`,
    )
    .join("");
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h1 style="margin:0 0 12px;font-size:18px;color:#111827">${heading}</h1>
      ${body}
      <a href="${link}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111827;color:#fff;border-radius:8px;font-size:14px;text-decoration:none">${linkLabel}</a>
      <p style="margin:20px 0 0;color:#9ca3af;font-size:12px">PixelSupport</p>
    </div>`;
}

// The platform owner's address. Always added to team-wide alerts so they get
// them even if no staff profile row carries a usable email.
function withAdmin(to: string[]): string[] {
  const admin = process.env.ADMIN_ALERT_EMAIL;
  return admin ? [...to, admin] : to;
}

// ---- Ticket notifications ------------------------------------------------

export async function notifyNewTicket(opts: {
  to: string[];
  ticketId: string;
  subject: string;
  companyName?: string | null;
}) {
  const who = opts.companyName ? ` from ${esc(opts.companyName)}` : "";
  await send(
    // Every new ticket reaches the admin, from any company, regardless of
    // which staff profiles happen to have emails on file.
    withAdmin(opts.to),
    `New ticket: ${opts.subject}`,
    wrap(
      "A new ticket was created",
      [`<strong>${esc(opts.subject)}</strong>${who}.`],
      `/tickets/${opts.ticketId}`,
      "View ticket",
    ),
  );
}

// Someone signed in. Sent to the platform alert address only.
export async function notifyLogin(opts: { email: string }) {
  const to = process.env.ADMIN_ALERT_EMAIL;
  if (!to) return;
  await send(
    [to],
    `Sign-in: ${opts.email}`,
    wrap(
      "Someone signed in",
      [`<strong>${esc(opts.email)}</strong> just signed in to PixelSupport.`],
      "/dashboard",
      "Open PixelSupport",
    ),
  );
}

export async function notifyTicketReceived(opts: {
  to: string[];
  ticketId: string;
  subject: string;
}) {
  await send(
    opts.to,
    `We received your ticket: ${opts.subject}`,
    wrap(
      "Thanks — we've got your ticket",
      [
        `Your ticket <strong>${esc(opts.subject)}</strong> has been received. Our team will get back to you.`,
      ],
      `/tickets/${opts.ticketId}`,
      "View ticket",
    ),
  );
}

export async function notifyNewReply(opts: {
  to: string[];
  ticketId: string;
  subject: string;
  fromLabel: string;
}) {
  await send(
    opts.to,
    `New reply: ${opts.subject}`,
    wrap(
      `New reply from ${esc(opts.fromLabel)}`,
      [`There's a new reply on <strong>${esc(opts.subject)}</strong>.`],
      `/tickets/${opts.ticketId}`,
      "View ticket",
    ),
  );
}

export async function notifyStatusChange(opts: {
  to: string[];
  ticketId: string;
  subject: string;
  statusLabel: string;
}) {
  await send(
    opts.to,
    `Status updated: ${opts.subject}`,
    wrap(
      "Ticket status updated",
      [
        `<strong>${esc(opts.subject)}</strong> is now <strong>${esc(opts.statusLabel)}</strong>.`,
      ],
      `/tickets/${opts.ticketId}`,
      "View ticket",
    ),
  );
}

// A ticket was assigned to a support rep — let them know.
export async function notifyAssignment(opts: {
  to: string[];
  ticketId: string;
  subject: string;
}) {
  await send(
    opts.to,
    `Assigned to you: ${opts.subject}`,
    wrap(
      "A ticket was assigned to you",
      [`<strong>${esc(opts.subject)}</strong> is now assigned to you.`],
      `/tickets/${opts.ticketId}`,
      "View ticket",
    ),
  );
}

// ---- Membership / signup notifications -----------------------------------

// A new person joined an organization (invited rep, contact, or colleague).
// Sent to the org's admins so they always know who's been added.
export async function notifyNewMember(opts: {
  to: string[];
  memberLabel: string;
  roleText: string;
  companyName?: string | null;
  path: string;
}) {
  const at = opts.companyName ? ` at ${esc(opts.companyName)}` : "";
  await send(
    opts.to,
    `New member added: ${opts.memberLabel}`,
    wrap(
      "A new member joined your organization",
      [
        `<strong>${esc(opts.memberLabel)}</strong> was added as a ${esc(opts.roleText)}${at}.`,
      ],
      opts.path,
      "Open PixelSupport",
    ),
  );
}

// A brand-new agency signed up. Sent to the platform alert address
// (ADMIN_ALERT_EMAIL), if configured.
export async function notifyNewSignup(opts: {
  orgName: string;
  adminEmail: string;
}) {
  const to = process.env.ADMIN_ALERT_EMAIL;
  if (!to) return;
  await send(
    [to],
    `New agency signed up: ${opts.orgName}`,
    wrap(
      "A new agency signed up",
      [
        `<strong>${esc(opts.orgName)}</strong> just created an account (admin: ${esc(opts.adminEmail)}).`,
      ],
      "/dashboard",
      "Open PixelSupport",
    ),
  );
}
