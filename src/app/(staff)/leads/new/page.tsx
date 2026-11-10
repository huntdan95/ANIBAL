import Link from "next/link";
import { LeadForm } from "@/components/LeadForm";
import { PageTitle } from "@/components/ui";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth";
import { createLead } from "../actions";

export default async function NewLeadPage() {
  const profile = await requireRole("admin", "referrer");
  const { lang, t } = await getT();
  const isAnibal = profile.role === "referrer";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/leads" className="inline-flex h-10 items-center font-semibold text-steel hover:text-navy">
        {t.leads.back}
      </Link>
      <PageTitle>{t.form.addTitle}</PageTitle>
      <LeadForm
        lang={lang}
        action={createLead}
        initial={{ state: "TN", language: "es", source: isAnibal ? "anibal" : "" }}
        cancelHref="/leads"
      />
    </div>
  );
}
