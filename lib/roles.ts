// Single source of truth for user roles in the agency model.
//
//   organization_admin  — runs the agency (Pixelmattic); manages everything
//   support_rep         — internal support staff; handles tickets, manages clients
//   company_contact     — a person at a client company (RDT, etc.); files tickets
//
// "Internal" roles are the agency's own people (no company_id). A company_contact
// belongs to exactly one client Company.

export type UserRole = "organization_admin" | "support_rep" | "company_contact";

export const ROLE_LABELS: Record<UserRole, string> = {
  organization_admin: "Organization Admin",
  support_rep: "Support Rep",
  company_contact: "Company Contact",
};

// The agency's own staff — everyone who is not a client contact.
export const INTERNAL_ROLES: UserRole[] = ["organization_admin", "support_rep"];

// True for agency staff (org admin or support rep). Accepts a loose string
// because role often arrives as a bare string from Supabase queries.
export function isInternal(role?: string | null): boolean {
  return role === "organization_admin" || role === "support_rep";
}

// Which side of a ticket conversation a role speaks for. Internal staff (admin
// + rep) both speak AS support; everyone else is the customer. Lives here so the
// AI prompt and the UI label can never disagree, and so client components can
// read it without pulling in the server-only AI module.
export type DraftPerspective = "client" | "support";

export function draftPerspective(role?: string | null): DraftPerspective {
  return isInternal(role) ? "support" : "client";
}

// Human-friendly label for any role value; falls back gracefully.
export function roleLabel(role?: string | null): string {
  if (role && role in ROLE_LABELS) return ROLE_LABELS[role as UserRole];
  return "Member";
}
