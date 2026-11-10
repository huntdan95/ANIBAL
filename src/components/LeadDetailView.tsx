import Link from "next/link";
import type { Lang, Messages } from "@/i18n/messages";
import { formatDate, formatPhone } from "@/lib/format";
import type { LeadFormState } from "@/lib/leads/validate";
import type { Lead } from "@/lib/types";
import { MailIcon, PhoneIcon } from "./icons";
import { planPings } from "@/lib/notify/plan";
import type { PrivateDetails } from "@/lib/leads/private";
import type { Intake } from "@/lib/portal/queries";
import type { Quote } from "@/lib/quotes";
import { CustomerAnswers } from "./CustomerAnswers";
import { LeadForm } from "./LeadForm";
import { PrivateDetailsCard } from "./PrivateDetailsCard";
import { QuotesPanel } from "./QuotesPanel";
import { NextStep } from "./NextStep";
import { ProgressBar } from "./ProgressBar";
import { buttonClass, Card, Fold, Notice } from "./ui";

/**
 * Danny's screen for one lead. Only what's needed now is open; the rest
 * (posting a quote when it isn't the next step, Danny-only details, editing) is folded.
 */
export function LeadDetailView({
  lead,
  t,
  lang,
  notice,
  setStage,
  updateLead,
  extras,
  actions,
  status,
}: {
  lead: Lead;
  t: Messages;
  lang: Lang;
  notice: { kind: "success" | "error"; text: string } | null;
  setStage: (fd: FormData) => Promise<void>;
  updateLead: (prev: LeadFormState, fd: FormData) => Promise<LeadFormState>;
  extras: { intake: Intake | null; priv: PrivateDetails | null; quotes: Quote[] };
  actions: {
    savePrivate: (fd: FormData) => Promise<void>;
    startQuoteUpload: () => Promise<{ path: string; token: string } | { error: string }>;
    finishQuote: (path: string, note: string) => Promise<{ error: string } | void>;
  };
  status: { privateSaved: "saved" | "error" | null; quotePosted: boolean };
}) {
  const quoteEmailNote = (() => {
    const who = [
      ...new Set(planPings("quote_posted", { referred: Boolean(lead.referrer_id) }).map((p) => t.lead.next.who[p.to])),
    ];
    return t.lead.next.willEmail(who.join(` ${t.lead.next.who.and} `));
  })();
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
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/leads" className="inline-flex h-10 items-center font-semibold text-steel hover:text-navy">
        {t.leads.back}
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-3xl leading-tight text-navy">{lead.full_name}</h1>
          {lead.is_example && (
            <span className="rounded-full border border-gold px-2.5 py-0.5 text-xs font-bold tracking-wide text-gold-dark">
              {t.leads.example}
            </span>
          )}
        </div>
        <p className="mt-1 text-slate-600">
          {[lead.business_name, t.lead.addedOn(formatDate(lead.new_at, lang))].filter(Boolean).join(" · ")}
        </p>
      </div>

      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      <Card>
        <ProgressBar lead={lead} t={t} lang={lang} />
      </Card>

      <Card>
        <NextStep lead={lead} t={t} setStage={setStage} wantsToProceed={extras.quotes.some((q) => q.proceed_at)} />
      </Card>

      <CustomerAnswers intake={extras.intake} t={t} lang={lang} />

      <QuotesPanel
        quotes={extras.quotes}
        t={t}
        lang={lang}
        justPosted={status.quotePosted}
        postOpen={lead.stage === "contacted" || lead.stage === "info_sent"}
        emailNote={quoteEmailNote}
        startUpload={actions.startQuoteUpload}
        finish={actions.finishQuote}
      />

      <PrivateDetailsCard priv={extras.priv} t={t} save={actions.savePrivate} status={status.privateSaved} />

      <Card>
        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:+1${lead.phone}`} className={buttonClass("secondary", "w-full")}>
            <PhoneIcon /> {t.lead.call}
          </a>
          <a href={`mailto:${lead.email}`} className={buttonClass("secondary", "w-full")}>
            <MailIcon /> {t.lead.email}
          </a>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-base">
          <div className="grid grid-cols-2 gap-3">
            <Item label={t.lead.phone}>
              <span className="whitespace-nowrap">{formatPhone(lead.phone)}</span>
            </Item>
            <Item label={t.lead.language}>{lead.language === "es" ? "Español" : "English"}</Item>
          </div>
          <Item label={t.lead.email}>
            <span className="break-all">{lead.email}</span>
          </Item>
          {address && <Item label={t.lead.address}>{address}</Item>}
          {lead.source && <Item label={t.leads.heardVia}>{t.source[lead.source]}</Item>}
          {lead.needs_notes && (
            <Item label={t.lead.needs}>
              <span className="whitespace-pre-line">{lead.needs_notes}</span>
            </Item>
          )}
        </dl>
      </Card>

      <Fold title={t.lead.editContact} bodyClassName="px-4 pb-1">
        <LeadForm lang={lang} action={updateLead} initial={initial} cancelHref={`/leads/${lead.id}`} />
      </Fold>
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{children}</dd>
    </div>
  );
}
