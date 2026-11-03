import Form from "next/form";
import Link from "next/link";
import type { Lang, Messages } from "@/i18n/messages";
import { FILTERS, filterLeads, type Filter } from "@/lib/leads/filter";
import type { Lead } from "@/lib/types";
import { PlusIcon, SearchIcon, UsersIcon } from "./icons";
import { LeadCard } from "./LeadCard";
import { ShareLink } from "./ShareLink";
import { buttonClass, Notice, PageTitle } from "./ui";

/** The lead list screen (Danny & Aníbal). Data comes in already limited by the database rules. */
export function LeadsView({
  all,
  filter,
  q,
  t,
  lang,
  isDanny,
  justAdded,
  shareUrl,
}: {
  all: Lead[];
  filter: Filter;
  q: string;
  t: Messages;
  lang: Lang;
  isDanny: boolean;
  justAdded: boolean;
  /** Aníbal's referral link (only passed for Aníbal) */
  shareUrl?: string;
}) {
  const leads = filterLeads(all, filter, q);
  const count = (f: Filter) => filterLeads(all, f, q).length;
  const href = (f: Filter) => `/leads?f=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <PageTitle>{t.leads.title}</PageTitle>
        <div className="hidden sm:block">
          <Link href="/leads/new" className={buttonClass("primary")}>
            <PlusIcon /> {t.leads.addShort}
          </Link>
        </div>
      </div>

      {justAdded && <Notice>{t.leads.added}</Notice>}

      {shareUrl && <ShareLink url={shareUrl} lang={lang} />}

      <Form action="/leads" className="relative">
        <input type="hidden" name="f" value={filter} />
        <label className="sr-only" htmlFor="q">
          {t.leads.searchLabel}
        </label>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t.leads.searchLabel}
          enterKeyHint="search"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-3 text-lg shadow-sm placeholder:text-slate-400 focus:border-steel focus:outline-none focus:ring-2 focus:ring-steel/30"
        />
      </Form>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label={t.leads.title}>
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <Link
              key={f}
              href={href(f)}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-base font-semibold transition ${
                active
                  ? "bg-navy text-white shadow-sm"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-navy/40"
              }`}
            >
              {t.leads.filters[f]}
              <span
                className={`rounded-full px-2 text-sm ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
              >
                {count(f)}
              </span>
            </Link>
          );
        })}
      </nav>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
          <UsersIcon className="mx-auto h-10 w-10 text-steel" />
          <p className="mt-3 text-lg font-bold text-navy">{q ? t.leads.noMatch : t.leads.emptyTitle}</p>
          {!q && <p className="mt-1 text-slate-600">{t.leads.emptyBody}</p>}
        </div>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} t={t} lang={lang} linkToLead={isDanny} now={now} />
          ))}
        </ul>
      )}

      {/* Phones: the main action stays under the thumb. */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-paper/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <Link href="/leads/new" className={buttonClass("primary", "h-14 w-full text-lg")}>
          <PlusIcon /> {t.leads.addShort}
        </Link>
      </div>
    </div>
  );
}
