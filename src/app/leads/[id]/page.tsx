import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/LeadForm";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth";
import { getLead } from "@/lib/leads/queries";
import { updateLead } from "../actions";

// Danny's page for one lead. Step 3: edit the referral.
// Later steps add the stage controls, Danny-only details and quotes here.
export default async function LeadPage({ params, searchParams }: PageProps<"/leads/[id]">) {
  await requireRole("admin");
  const { id } = await params;
  const { saved } = await searchParams;
  const lead = await getLead(id);
  if (!lead) notFound();
  const { lang, t } = await getT();

  const initial: Record<string, string> = {
    full_name: lead.full_name,
    phone: lead.phone,
    email: lead.email,
    street: lead.street ?? "",
    city: lead.city ?? "",
    state: lead.state ?? "TN",
    zip: lead.zip ?? "",
    business_name: lead.business_name ?? "",
    language: lead.language,
    needs_notes: lead.needs_notes ?? "",
    source: lead.source ?? "",
    referred_by_anibal: lead.referrer_id ? "on" : "",
  };

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/leads" className="text-base font-semibold text-steel">
        {t.leads.back}
      </Link>
      <h1 className="mt-2 font-serif text-3xl text-navy">{lead.full_name}</h1>
      {saved === "1" && (
        <p className="mt-4 rounded-xl border border-gold bg-cream-light p-3 font-semibold text-navy-dark">
          ✓ {t.leads.saved}
        </p>
      )}
      <h2 className="mt-6 text-xl font-bold text-navy">{t.form.editTitle}</h2>
      <div className="mt-3">
        <LeadForm
          lang={lang}
          action={updateLead.bind(null, lead.id)}
          initial={initial}
          showReferrerBox
          cancelHref="/leads"
        />
      </div>
    </div>
  );
}
