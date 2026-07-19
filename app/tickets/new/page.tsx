"use client";

import Link from "next/link";
import { useActionState } from "react";
import AppHeader from "@/components/AppHeader";
import { createTicket, type TicketFormState } from "@/app/tickets/actions";
import { PRIORITY_OPTIONS, PRIORITY_LABELS } from "@/lib/tickets";

export default function NewTicketPage() {
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(
    createTicket,
    null,
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/tickets" className="text-sm text-gray-500 hover:underline">
          ← Back to tickets
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">New ticket</h1>
        <p className="mt-1 text-sm text-gray-500">
          Describe the issue. You can change the priority later.
        </p>

        <form
          action={formAction}
          className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-gray-200"
        >
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Subject</span>
            <input
              name="subject"
              type="text"
              required
              placeholder="Short summary of the issue"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Description
            </span>
            <textarea
              name="description"
              rows={5}
              placeholder="What's happening? Steps to reproduce, links, etc."
              className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Priority</span>
            <select
              name="priority"
              defaultValue="medium"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create ticket"}
            </button>
            <Link
              href="/tickets"
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
