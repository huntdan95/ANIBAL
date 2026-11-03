import Link from "next/link";
import { LeadForm } from "@/components/LeadForm";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth";
import { createLead } from "../actions";

export default async function NewLeadPage() {
  const profile = await requireRole("admin", "referrer");
  const { lang, t } = await getT();
  const isAnibal = profile.role === "referrer";

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/leads" className="text-base font-semibold text-steel">
        {t.leads.back}
      </Link>
      <h1 className="mt-2 font-serif text-3xl text-navy">{t.form.addTitle}</h1>
      <div className="mt-4">
        <LeadForm
          lang={lang}
          action={createLead}
          initial={{ state: "TN", language: "es", source: isAnibal ? "anibal" : "" }}
          showReferrerBox={!isAnibal}
          cancelHref="/leads"
        />
      </div>
    </div>
  );
}
