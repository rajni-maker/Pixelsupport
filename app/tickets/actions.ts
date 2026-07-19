"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PRIORITY_OPTIONS, type TicketPriority } from "@/lib/tickets";

export type TicketFormState = { error: string } | null;

// Create a new ticket for the logged-in user's company.
export async function createTicket(
  _prev: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const subject = String(formData.get("subject") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium") as TicketPriority;

  if (!subject) return { error: "Subject is required." };
  if (!PRIORITY_OPTIONS.includes(priority)) {
    return { error: "Please choose a valid priority." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Look up the user's company so we can stamp it on the ticket. RLS also
  // enforces this, but we need the value to insert.
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Could not find your profile." };

  const { error } = await supabase.from("tickets").insert({
    organization_id: profile.organization_id,
    client_id: user.id,
    subject,
    description: description || null,
    priority,
    // status defaults to 'open' in the database
  });

  if (error) return { error: error.message };

  revalidatePath("/tickets");
  redirect("/tickets");
}
