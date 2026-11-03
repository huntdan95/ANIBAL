import { notFound } from "next/navigation";
import { LeadDetailView } from "@/components/LeadDetailView";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth";
import { getLeadExtras } from "@/lib/leads/extras";
import { getLead } from "@/lib/leads/queries";
import { finishQuote, savePrivate, setStage, startQuoteUpload, updateLead } from "../actions";

// Danny's page for one lead: progress, next step, customer's answers, quotes, Danny-only details, contact.
export default async function LeadPage({ params, searchParams }: PageProps<"/leads/[id]">) {
  await requireRole("admin");
  const { id } = await params;
  const sp = await searchParams;
  const lead = await getLead(id);
  if (!lead) notFound();
  const { lang, t } = await getT();
  const extras = await getLeadExtras(lead.id);

  const notice =
    sp.stage === "error"
      ? { kind: "error" as const, text: t.form.failed }
      : sp.saved === "1"
        ? { kind: "success" as const, text: t.leads.saved }
        : sp.stage === "saved"
          ? { kind: "success" as const, text: t.lead.stageSaved }
          : null;

  return (
    <LeadDetailView
      lead={lead}
      t={t}
      lang={lang}
      notice={notice}
      setStage={setStage.bind(null, lead.id)}
      updateLead={updateLead.bind(null, lead.id)}
      extras={extras}
      actions={{
        savePrivate: savePrivate.bind(null, lead.id),
        startQuoteUpload: startQuoteUpload.bind(null, lead.id),
        finishQuote: finishQuote.bind(null, lead.id),
      }}
      status={{
        privateSaved: sp.private === "saved" ? "saved" : sp.private === "error" ? "error" : null,
        quotePosted: sp.quote === "posted",
      }}
    />
  );
}
