import type { Lang, Messages } from "@/i18n/messages";
import { AGENT } from "@/lib/agent";
import { formatDate } from "@/lib/format";
import type { Intake } from "@/lib/portal/queries";
import type { IntakeFormState } from "@/lib/portal/validate";
import type { Lead } from "@/lib/types";
import { firstName } from "@/lib/notify/render";
import { MailIcon, PhoneIcon } from "./icons";
import { IntakeForm } from "./IntakeForm";
import { ProgressBar } from "./ProgressBar";
import { buttonClass, Card, Notice, PageTitle } from "./ui";

/** The customer's page: their progress, "Mi información", "Mis cotizaciones", and Danny's contact info. */
export function PortalView({
  lead,
  intake,
  t,
  lang,
  justSent,
  submitIntake,
}: {
  lead: Lead | null;
  intake: Intake | null;
  t: Messages;
  lang: Lang;
  justSent: boolean;
  submitIntake: (prev: IntakeFormState, fd: FormData) => Promise<IntakeFormState>;
}) {
  const p = t.portal;
  const contact = (
    <Card className="border-l-4 border-l-gold">
      <h2 className="text-sm font-bold uppercase tracking-wider text-steel">{p.contactTitle}</h2>
      <p className="mt-1 text-xl font-bold text-navy">{AGENT.name}</p>
      <p className="text-slate-600">{AGENT.agencyFull}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={AGENT.phoneHref} className={buttonClass("primary", "w-full")}>
          <PhoneIcon /> {p.callDanny}
        </a>
        <a href={`mailto:${AGENT.email}`} className={buttonClass("secondary", "w-full")}>
          <MailIcon /> {p.emailDanny}
        </a>
      </div>
      <p className="mt-2 text-center text-sm text-slate-500">
        {AGENT.phone} · {AGENT.email}
      </p>
    </Card>
  );

  if (!lead) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <PageTitle>{p.title}</PageTitle>
        <Notice kind="warning">{p.noFile}</Notice>
        {contact}
      </div>
    );
  }

  const initial: Record<string, string | string[]> = {
    full_name: lead.full_name,
    phone: lead.phone,
    street: lead.street ?? "",
    city: lead.city ?? "",
    state: lead.state ?? "TN",
    zip: lead.zip ?? "",
    language: lead.language,
    business_name: lead.business_name ?? "",
    needs: intake?.needs ?? [],
    work_type: intake?.work_type ?? "",
    weekly_payroll: intake?.weekly_payroll != null ? String(intake.weekly_payroll) : "",
    weeks_per_year: intake?.weeks_per_year != null ? String(intake.weeks_per_year) : "",
    roof_year: intake?.roof_year != null ? String(intake.roof_year) : "",
    vehicle_count: intake?.vehicle_count != null ? String(intake.vehicle_count) : "",
    driver_count: intake?.driver_count != null ? String(intake.driver_count) : "",
    other_need: intake?.other_need ?? "",
  };
  const form = <IntakeForm lang={lang} action={submitIntake} initial={initial} email={lead.email} />;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageTitle sub={p.intro}>{p.hello(firstName(lead.full_name))}</PageTitle>

      {justSent && (
        <Notice>
          <span className="block">{p.sentTitle}</span>
          <span className="block font-normal">{p.sentBody}</span>
        </Notice>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-steel">{p.progressTitle}</h2>
        <ProgressBar lead={lead} t={t} lang={lang} />
      </Card>

      {intake ? (
        <>
          <Card>
            <h2 className="text-sm font-bold uppercase tracking-wider text-steel">{p.quotesTitle}</h2>
            <p className="mt-2 text-slate-600">{p.noQuotes}</p>
          </Card>
          <details className="group rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="block text-lg font-bold text-navy">{p.editInfo}</span>
                <span className="block text-sm text-slate-500">
                  {p.lastSent(formatDate(intake.submitted_at, lang))}
                </span>
              </span>
              <span className="inline-block text-steel transition group-open:rotate-180" aria-hidden>
                ▾
              </span>
            </summary>
            <div className="px-4 pb-1">{form}</div>
          </details>
        </>
      ) : (
        <section className="space-y-3">
          <div>
            <h2 className="font-serif text-2xl text-navy">{p.infoTitle}</h2>
            <p className="text-slate-600">{p.infoIntro}</p>
          </div>
          {form}
        </section>
      )}

      {contact}
    </div>
  );
}
