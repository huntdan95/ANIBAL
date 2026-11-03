import Link from "next/link";
import type { Lang, Messages } from "@/i18n/messages";
import { daysSince, formatPhone } from "@/lib/format";
import type { Lead } from "@/lib/types";
import { PhoneIcon } from "./icons";
import { ProgressBar } from "./ProgressBar";

const stageStyle: Record<Lead["stage"], string> = {
  new: "bg-steel/15 text-navy",
  contacted: "bg-steel/10 text-navy",
  info_sent: "bg-steel/10 text-navy",
  quote_sent: "bg-steel/10 text-navy",
  bound: "bg-cream text-gold-dark",
  not_bought: "bg-slate-100 text-slate-600",
  not_fit: "bg-slate-100 text-slate-600",
};

/** One lead in the list. For Danny the whole card opens the lead; Aníbal's cards are read-only. */
export function LeadCard({
  lead,
  t,
  lang,
  linkToLead,
  now,
}: {
  lead: Lead;
  t: Messages;
  lang: Lang;
  linkToLead: boolean;
  now: Date;
}) {
  const idleDays = lead.stage === "new" ? daysSince(lead.new_at, now) : 0;
  const idle = idleDays >= 2;
  const subtitle = [lead.business_name, [lead.city, lead.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ");

  return (
    <li
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        idle ? "border-amber-300" : "border-slate-200/80"
      } ${linkToLead ? "hover:border-steel/60 hover:shadow-md" : ""}`}
    >
      {idle && <span className="absolute inset-y-0 left-0 w-1.5 bg-amber-400" aria-hidden />}
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-snug text-navy">
              {linkToLead ? (
                // The ::after covers the whole card, so the entire card is one big tap target.
                <Link href={`/leads/${lead.id}`} className="after:absolute after:inset-0">
                  {lead.full_name}
                </Link>
              ) : (
                lead.full_name
              )}
            </h3>
            {subtitle && <p className="truncate text-sm text-slate-600">{subtitle}</p>}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${stageStyle[lead.stage]}`}>
            {t.stage[lead.stage]}
          </span>
        </div>

        <div className="mt-4">
          <ProgressBar lead={lead} t={t} lang={lang} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <a
            href={`tel:+1${lead.phone}`}
            className="relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full bg-navy/[0.07] px-3 font-semibold text-navy hover:bg-navy/[0.12]"
          >
            <PhoneIcon />
            {formatPhone(lead.phone)}
          </a>
          {lead.source && (
            <span className="inline-flex h-9 items-center rounded-full bg-slate-100 px-3 text-slate-600">
              {t.source[lead.source]}
            </span>
          )}
          {idle && (
            <span className="inline-flex h-9 items-center rounded-full bg-amber-100 px-3 font-bold text-amber-900">
              {t.leads.daysWithoutContact(idleDays)}
            </span>
          )}
          {lead.is_example && (
            <span className="inline-flex h-9 items-center rounded-full border border-gold px-3 font-bold tracking-wide text-gold-dark">
              {t.leads.example}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
