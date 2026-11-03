import Link from "next/link";
import type { Messages, Lang } from "@/i18n/messages";
import { daysSince, formatPhone } from "@/lib/format";
import type { Lead } from "@/lib/types";

const stageStyle: Record<Lead["stage"], string> = {
  new: "bg-steel/15 text-navy",
  contacted: "bg-steel/15 text-navy",
  info_sent: "bg-steel/15 text-navy",
  quote_sent: "bg-steel/15 text-navy",
  bound: "bg-cream text-gold-dark",
  not_bought: "bg-slate-100 text-slate-600",
  not_fit: "bg-slate-100 text-slate-600",
};

/** One lead in the list. Danny's cards open the lead; Aníbal's are read-only. */
export function LeadCard({
  lead,
  t,
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
  const place = [lead.city, lead.state].filter(Boolean).join(", ");

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {linkToLead ? (
            <Link href={`/leads/${lead.id}`} className="text-lg font-bold text-navy underline-offset-2 hover:underline">
              {lead.full_name}
            </Link>
          ) : (
            <p className="text-lg font-bold text-navy">{lead.full_name}</p>
          )}
          {lead.business_name && <p className="truncate text-slate-600">{lead.business_name}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold ${stageStyle[lead.stage]}`}>
          {t.stage[lead.stage]}
        </span>
      </div>

      <div className="mt-2 space-y-0.5 text-base text-slate-700">
        <p>
          <a href={`tel:+1${lead.phone}`} className="whitespace-nowrap font-semibold text-navy underline">
            {formatPhone(lead.phone)}
          </a>
          {place && <span className="text-slate-600"> · {place}</span>}
        </p>
        {lead.source && (
          <p className="text-slate-600">
            {t.leads.heardVia}: {t.source[lead.source]}
          </p>
        )}
      </div>

      {(idleDays >= 2 || lead.is_example) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {idleDays >= 2 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-sm font-bold text-amber-900">
              ⚠ {t.leads.daysWithoutContact(idleDays)}
            </span>
          )}
          {lead.is_example && (
            <span className="rounded-full border border-gold px-2.5 py-1 text-sm font-bold tracking-wide text-gold-dark">
              {t.leads.example}
            </span>
          )}
        </div>
      )}
    </li>
  );
}
