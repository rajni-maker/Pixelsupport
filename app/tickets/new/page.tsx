import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { isInternal, roleLabel } from "@/lib/roles";
import NewTicketForm from "./NewTicketForm";
import "@/components/dashboard/dark.css";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  const internal = isInternal(profile?.role);

  // Internal staff pick a client company; contacts don't, so only fetch when needed.
  let companies: { id: string; name: string }[] = [];
  if (internal) {
    const { data } = await supabase
      .from("companies")
      .select("id, name")
      .order("name", { ascending: true });
    companies = data ?? [];
  }

  // Arriving from a company's detail page pre-picks that client. Only honour the
  // id if it's one the viewer can actually see, so a hand-typed ?company= can't
  // preselect something outside their agency — it just falls back to "choose one".
  const fromCompany = companies.find((c) => c.id === company);

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

        {/* Narrower than the list pages — this is a single focused form. */}
        <main className="mx-auto max-w-[720px] px-5 py-8 sm:px-8">
          <Link
            href={fromCompany ? `/companies/${fromCompany.id}` : "/tickets"}
            className="psd-in inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6b6b8a] transition-colors hover:text-[#f0f0f5]"
            style={{ "--psd-delay": "0.05s" } as React.CSSProperties}
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
            {fromCompany ? `Back to ${fromCompany.name}` : "Back to tickets"}
          </Link>

          <section
            className="psd-in mb-7 mt-4"
            style={{ "--psd-delay": "0.1s" } as React.CSSProperties}
          >
            <h1 className="psd-title text-[26px] font-bold leading-tight tracking-[-0.025em] sm:text-[32px]">
              New ticket
            </h1>
            <p className="mt-1.5 text-[15px] text-[#a0a0b8]">
              {fromCompany
                ? `Raising this on behalf of ${fromCompany.name}. You can change the priority later.`
                : "Describe the issue. You can change the priority later."}
            </p>
          </section>

          <div
            className="psd-in"
            style={{ "--psd-delay": "0.15s" } as React.CSSProperties}
          >
            <NewTicketForm
              isInternal={internal}
              companies={companies}
              defaultCompanyId={fromCompany?.id ?? ""}
              cancelHref={fromCompany ? `/companies/${fromCompany.id}` : "/tickets"}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
