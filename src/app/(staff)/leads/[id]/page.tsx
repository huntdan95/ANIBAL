import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/LeadForm";
import { ProgressBar } from "@/components/ProgressBar";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth";
import { formatDate, formatPhone } from "@/lib/format";
import { getLead } from "@/lib/leads/queries";
import { STAGES } from "@/lib/types";
import { setStage, updateLead } from "../actions";

const card = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

// Danny's page for one lead: progress, stage, contact info, edit.
// (Danny-only details and quotes are added here in step 7.)
export default async function LeadPage({ params, searchParams }: PageProps<"/leads/[id]">) {
  await requireRole("admin");
  const { id } = await params;
  const sp = await searchParams;
  const lead = await getLead(id);
  if (!lead) notFound();
  const { lang, t } = await getT();

  const address = [lead.street, [lead.city, lead.state].filter(Boolean).join(", "), lead.zip]
    .filter(Boolean)
    .join(" · ");

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

  const notice =
    sp.saved === "1" ? t.leads.saved : sp.stage === "saved" ? t.lead.stageSaved : sp.stage === "error" ? t.form.failed : null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/leads" className="text-base font-semibold text-steel">
        {t.leads.back}
      </Link>
      <div>
        <h1 className="font-serif text-3xl text-navy">{lead.full_name}</h1>
        {lead.business_name && <p className="text-lg text-slate-600">{lead.business_name}</p>}
        <p className="mt-1 text-sm text-slate-500">
          {t.lead.addedOn(formatDate(lead.new_at, lang))}
          {lead.is_example && <span className="ml-2 font-bold text-gold-dark">{t.leads.example}</span>}
        </p>
      </div>

      {notice && (
        <p
          className={`rounded-xl border p-3 font-semibold ${
            sp.stage === "error" ? "border-red-300 bg-red-50 text-red-800" : "border-gold bg-cream-light text-navy-dark"
          }`}
        >
          {sp.stage === "error" ? notice : `✓ ${notice}`}
        </p>
      )}

      <section className={card}>
        <ProgressBar lead={lead} t={t} lang={lang} />
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold text-navy">{t.lead.stageTitle}</h2>
        <form action={setStage.bind(null, lead.id)} className="mt-2 flex gap-2">
          <select
            name="stage"
            defaultValue={lead.stage}
            aria-label={t.lead.stageTitle}
            className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-lg"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {t.stage[s]}
              </option>
            ))}
          </select>
          <button type="submit" className="h-12 rounded-xl bg-navy px-4 font-bold text-white hover:bg-navy-dark">
            {t.lead.saveStage}
          </button>
        </form>
        <p className="mt-2 text-sm text-slate-500">{t.lead.autoHint}</p>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold text-navy">{t.lead.contactTitle}</h2>
        <dl className="mt-2 space-y-2 text-base">
          <div>
            <dt className="text-sm text-slate-500">{t.lead.phone}</dt>
            <dd>
              <a href={`tel:+1${lead.phone}`} className="font-semibold text-navy underline">
                {formatPhone(lead.phone)}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">{t.lead.email}</dt>
            <dd className="break-all">
              <a href={`mailto:${lead.email}`} className="text-navy underline">
                {lead.email}
              </a>
            </dd>
          </div>
          {address && (
            <div>
              <dt className="text-sm text-slate-500">{t.lead.address}</dt>
              <dd>{address}</dd>
            </div>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <dt className="text-sm text-slate-500">{t.lead.language}</dt>
              <dd>{lead.language === "es" ? "Español" : "English"}</dd>
            </div>
            {lead.source && (
              <div>
                <dt className="text-sm text-slate-500">{t.leads.heardVia}</dt>
                <dd>{t.source[lead.source]}</dd>
              </div>
            )}
            {lead.referrer_id && (
              <div>
                <dt className="text-sm text-slate-500">&nbsp;</dt>
                <dd className="font-semibold text-gold-dark">✓ {t.lead.referredBy}</dd>
              </div>
            )}
          </div>
          {lead.needs_notes && (
            <div>
              <dt className="text-sm text-slate-500">{t.lead.needs}</dt>
              <dd className="whitespace-pre-line">{lead.needs_notes}</dd>
            </div>
          )}
        </dl>
      </section>

      <details className={card} open={sp.saved === "1" ? false : undefined}>
        <summary className="cursor-pointer text-lg font-bold text-navy">{t.lead.editContact}</summary>
        <div className="mt-4">
          <LeadForm
            lang={lang}
            action={updateLead.bind(null, lead.id)}
            initial={initial}
            showReferrerBox
            cancelHref={`/leads/${lead.id}`}
          />
        </div>
      </details>
    </div>
  );
}
