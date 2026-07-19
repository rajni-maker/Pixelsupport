import Anthropic from "@anthropic-ai/sdk";
import type { TicketPriority } from "@/lib/tickets";

// Server-only Anthropic client. Uses ANTHROPIC_API_KEY from .env.local.
function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const MODEL = "claude-opus-4-8";

export type TriageResult = {
  summary: string;
  category: string;
  suggested_priority: TicketPriority;
  tags: string[];
};

// Ask Claude to summarize a new ticket and suggest a category/priority/tags.
// Structured outputs guarantee we get back valid JSON in this exact shape.
export async function triageTicket(
  subject: string,
  description: string,
): Promise<TriageResult> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
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
    messages: [
      {
        role: "user",
        content:
          "You are a support-desk triage assistant. Read this ticket and return:\n" +
          "- a one or two sentence summary\n" +
          "- a short category (e.g. Billing, Bug, How-to, Account)\n" +
          "- a suggested priority\n" +
          "- up to 4 short tags\n\n" +
          `Subject: ${subject}\n\nDescription: ${description || "(none)"}`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  return JSON.parse(text) as TriageResult;
}

// Ask Claude to draft a support reply based on the ticket and its conversation.
// Returns plain text the agent edits before sending — never auto-sent.
export async function draftReplyText(
  subject: string,
  description: string,
  messages: { sender_role: string | null; body: string }[],
): Promise<string> {
  const client = getClient();
  const thread =
    messages.map((m) => `${m.sender_role ?? "user"}: ${m.body}`).join("\n") ||
    "(no replies yet)";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: { effort: "low" },
    messages: [
      {
        role: "user",
        content:
          "You are a helpful support agent. Draft a clear, friendly, professional reply " +
          "to the customer for the ticket below. Do not invent facts you don't have; " +
          "if information is missing, politely ask for it. Return only the reply text.\n\n" +
          `Subject: ${subject}\n\nDescription: ${description || "(none)"}\n\n` +
          `Conversation so far:\n${thread}`,
      },
    ],
  });

  return response.content.find((b) => b.type === "text")?.text ?? "";
}
