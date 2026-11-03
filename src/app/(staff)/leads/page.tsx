import Form from "next/form";
import Link from "next/link";
import { LeadCard } from "@/components/LeadCard";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth";
import { asFilter, FILTERS, filterLeads } from "@/lib/leads/filter";
import { listVisibleLeads } from "@/lib/leads/queries";

// Danny & Aníbal's home: the lead list.
export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const profile = await requireRole("admin", "referrer");
  const { lang, t } = await getT();
  const sp = await searchParams;
  const filter = asFilter(sp.f);
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";

  const all = await listVisibleLeads();
  const leads = filterLeads(all, filter, q);
  const now = new Date();
  const href = (f: string) => `/leads?f=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-navy">{t.leads.title}</h1>
        <Link
          href="/leads/new"
          className="flex h-12 items-center rounded-xl bg-navy px-4 text-base font-bold text-white hover:bg-navy-dark"
        >
          {t.leads.add}
        </Link>
      </div>

      {sp.added === "1" && (
        <p className="mt-4 rounded-xl border border-gold bg-cream-light p-3 font-semibold text-navy-dark">
          ✓ {t.leads.added}
        </p>
      )}

      <Form action="/leads" className="mt-5 flex gap-2">
        <input type="hidden" name="f" value={filter} />
        <label className="sr-only" htmlFor="q">
          {t.leads.searchLabel}
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t.leads.searchLabel}
          className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-lg focus:border-steel focus:outline-none focus:ring-2 focus:ring-steel/40"
        />
        <button type="submit" className="h-12 rounded-xl border border-navy px-4 font-semibold text-navy">
          {t.leads.search}
        </button>
      </Form>

      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Filter">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={href(f)}
            aria-current={f === filter ? "page" : undefined}
            className={`flex h-10 shrink-0 items-center rounded-full px-4 text-base font-semibold ${
              f === filter ? "bg-navy text-white" : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            {t.leads.filters[f]}
          </Link>
        ))}
      </nav>

      {leads.length === 0 ? (
        <p className="mt-8 text-center text-lg text-slate-600">{q ? t.leads.noMatch : t.leads.empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              t={t}
              lang={lang}
              linkToLead={profile.role === "admin"}
              now={now}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
