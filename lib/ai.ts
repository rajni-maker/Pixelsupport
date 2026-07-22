// Server-only AI helpers, backed by the OpenAI Chat Completions API.
// Uses fetch directly (no SDK dependency). Reads OPENAI_API_KEY from .env.local.
import type { TicketPriority } from "@/lib/tickets";
import { roleLabel, isInternal, draftPerspective } from "@/lib/roles";

const MODEL = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export type TriageResult = {
  summary: string;
  category: string;
  suggested_priority: TicketPriority;
  tags: string[];
};

// Low-level call. Throws on a non-2xx response so callers can decide how to
// handle failure (triage is best-effort; draft surfaces the error).
async function chat(body: Record<string, unknown>): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, ...body }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Summarize a new ticket and suggest a category/priority/tags. Structured
// outputs (json_schema, strict) guarantee valid JSON in this exact shape.
export async function triageTicket(
  subject: string,
  description: string,
): Promise<TriageResult> {
  const content = await chat({
    messages: [
      {
        role: "system",
        content: "You are a support-desk triage assistant.",
      },
      {
        role: "user",
        content:
          "Read this ticket and return a one or two sentence summary, a short " +
          "category (e.g. Billing, Bug, How-to, Account), a suggested priority, " +
          "and up to 4 short tags.\n\n" +
          `Subject: ${subject}\n\nDescription: ${description || "(none)"}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "triage",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            category: { type: "string" },
            suggested_priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
            },
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["summary", "category", "suggested_priority", "tags"],
          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(content || "{}") as TriageResult;
}

// The immediate, auto-sent first reply when a client opens a ticket. Warm,
// brief, and sets the 24-hour expectation — without promising a solution.
export async function acknowledgeReply(
  subject: string,
  description: string,
): Promise<string> {
  return chat({
    messages: [
      {
        role: "system",
        content:
          "You write the first automatic acknowledgment sent the moment a " +
          "customer opens a support ticket. Write a brief (1-2 sentence), warm, " +
          "professional message that confirms we received their request and that " +
          "a support representative will respond within 24 hours. Do not promise " +
          "a fix or make up details. Return only the message text.",
      },
      {
        role: "user",
        content: `Ticket subject: ${subject}\n\nDetails: ${description || "(none)"}`,
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Reply intent — "does the client consider this fixed?"
//
// Used to suggest (never apply) a move to Resolved. Deliberately narrow: the
// deterministic rules in autoStatusOnReply() handle everything that doesn't
// need judgement, so this only has to recognise a client confirming the fix.
// ---------------------------------------------------------------------------

export type ReplyIntent =
  | "confirms_resolved" // "that worked", "all good now"
  | "still_broken" // tried it, no luck
  | "providing_info" // answering a question, adding detail
  | "other";

/**
 * Classify a client's reply. Returns "other" on any failure — this feeds a
 * suggestion, so a wrong guess must never be worse than no guess.
 */
export async function classifyReplyIntent(
  subject: string,
  latestReply: string,
): Promise<ReplyIntent> {
  try {
    const content = await chat({
      messages: [
        {
          role: "system",
          content:
            "You classify a customer's latest message in a support ticket. " +
            "Answer with the single best-fitting intent.\n" +
            "- confirms_resolved: the customer indicates the problem is fixed " +
            "or they are satisfied and need nothing further.\n" +
            "- still_broken: the customer says the problem persists or a " +
            "suggested fix did not work.\n" +
            "- providing_info: the customer is answering a question, adding " +
            "detail, or attaching evidence.\n" +
            "- other: anything else, including simple thanks with no " +
            "indication the issue is fixed.\n" +
            "Be conservative: only choose confirms_resolved when the customer " +
            "clearly signals the issue is done.",
        },
        {
          role: "user",
          content: `Ticket subject: ${subject}\n\nCustomer's latest message:\n${latestReply}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "reply_intent",
          strict: true,
          schema: {
            type: "object",
            properties: {
              intent: {
                type: "string",
                enum: [
                  "confirms_resolved",
                  "still_broken",
                  "providing_info",
                  "other",
                ],
              },
            },
            required: ["intent"],
            additionalProperties: false,
          },
        },
      },
    });
    return (JSON.parse(content || "{}").intent ?? "other") as ReplyIntent;
  } catch {
    return "other";
  }
}

// ---------------------------------------------------------------------------
// Draft reply — written from the perspective of whoever is logged in.
//
// A ticket thread has two sides. The agency's own staff (organization_admin and
// support_rep) speak AS support; a company_contact is the customer and speaks as
// themselves. Drafting always used the support voice, so a client clicking the
// button got a reply that apologised on support's behalf and signed off as the
// "Support Team" — writing the wrong side of their own conversation.
// ---------------------------------------------------------------------------

/** Everything the model needs to write in the right voice about the right ticket. */
export type DraftContext = {
  /** The logged-in user's role — decides the voice. */
  viewerRole?: string | null;
  subject: string;
  description: string;
  priority?: string | null;
  status?: string | null;
  companyName?: string | null;
  messages: { sender_role: string | null; body: string }[];
};

// Optional sign-off appended to support drafts, e.g. "Regards, The Acme Team".
// Unset (the default) means no signature — the rep signs off however they like.
const SUPPORT_SIGNATURE = process.env.SUPPORT_SIGNATURE?.trim();

const CLIENT_SYSTEM_PROMPT =
  "You are helping a CUSTOMER write their next message in a support ticket " +
  "they opened. You are the customer, not the support team.\n\n" +
  "Write in the customer's voice: first person, describing THEIR experience " +
  "and THEIR system. Typical goals are adding information, answering a " +
  "question support asked, confirming the issue still happens, noting it is " +
  "now resolved, mentioning an attached screenshot, or asking for an update.\n\n" +
  "Hard rules:\n" +
  "- Never apologise on behalf of support, and never thank yourself for " +
  "contacting support.\n" +
  "- Never promise support actions ('we'll look into it', 'we'll fix this').\n" +
  "- Never sign off as 'Support Team', 'Support', or any agency name.\n" +
  "- Never offer troubleshooting steps as if you were the one supporting.\n" +
  "- Do not invent technical details, error messages, or outcomes that are " +
  "not already in the conversation. If something is unknown, say so plainly " +
  "or ask support about it.\n\n" +
  "Keep it short and natural — a few sentences, plain language. Return only " +
  "the message text, with no subject line and no signature block.";

const SUPPORT_SYSTEM_PROMPT =
  "You are a support representative replying to a customer in a support " +
  "ticket. Write a clear, friendly, professional response.\n\n" +
  "Depending on where the conversation stands, this may offer troubleshooting " +
  "steps, set out next steps, request the specific information you still need, " +
  "or confirm a resolution.\n\n" +
  "Do not invent facts you do not have; if information is missing, politely " +
  "ask for it. Do not promise dates or outcomes that are not already agreed in " +
  "the thread. Return only the reply text, with no subject line.";

/**
 * Draft the next message in a ticket thread, in the logged-in user's voice.
 * Returns plain text the user edits before sending — never auto-sent.
 *
 * The caller is responsible for resolving `viewerRole` from the session; it is
 * never taken from the browser.
 */
export async function draftReplyText(ctx: DraftContext): Promise<string> {
  const perspective = draftPerspective(ctx.viewerRole);

  // Label each turn by side rather than by raw role, so the model can tell at a
  // glance which lines are its own previous messages and which are the reply to.
  const thread =
    ctx.messages
      .map((m) => {
        const side = isInternal(m.sender_role) ? "Support" : "Customer";
        return `${side} (${roleLabel(m.sender_role)}): ${m.body}`;
      })
      .join("\n") || "(no replies yet)";

  const latest = ctx.messages.at(-1);
  const latestLine = latest
    ? `\n\nThe message you are replying to (most recent):\n${latest.body}`
    : "";

  let system =
    perspective === "client" ? CLIENT_SYSTEM_PROMPT : SUPPORT_SYSTEM_PROMPT;
  if (perspective === "support" && SUPPORT_SIGNATURE) {
    system += `\n\nEnd the reply with this sign-off exactly:\n${SUPPORT_SIGNATURE}`;
  }

  const facts = [
    `Subject: ${ctx.subject}`,
    ctx.companyName ? `Customer company: ${ctx.companyName}` : null,
    ctx.priority ? `Priority: ${ctx.priority}` : null,
    ctx.status ? `Status: ${ctx.status}` : null,
    `\nOriginal request: ${ctx.description || "(none)"}`,
    `\nConversation so far:\n${thread}`,
  ]
    .filter(Boolean)
    .join("\n");

  return chat({
    messages: [
      { role: "system", content: system },
      { role: "user", content: facts + latestLine },
    ],
  });
}
