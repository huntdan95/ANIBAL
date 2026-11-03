import Link from "next/link";
import type { Lang, Messages } from "@/i18n/messages";
import { describeEvent, type EventKind, type FeedItem } from "@/lib/activity";
import { formatDay } from "@/lib/format";

const dot: Record<EventKind, string> = {
  created: "bg-steel",
  contacted: "bg-navy",
  info_sent: "bg-navy",
  quote_sent: "bg-navy",
  proceed: "bg-gold",
  bound: "bg-gold",
  not_bought: "bg-slate-400",
  not_fit: "bg-slate-400",
  reopened: "bg-steel",
};

/** The activity feed: one line per event, for example "Juan Pérez envió su información · 3 nov". */
export function ActivityList({
  items,
  t,
  lang,
  linkToLead,
}: {
  items: FeedItem[];
  t: Messages;
  lang: Lang;
  linkToLead: boolean;
}) {
  if (items.length === 0) return <p className="mt-8 text-center text-lg text-slate-600">{t.feed.empty}</p>;
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {items.map((e) => {
        const text = describeEvent(t, e);
        return (
          <li key={e.id} className="flex items-start gap-3 px-4 py-3.5">
            <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${dot[e.kind]}`} aria-hidden />
            <p className="text-base leading-snug">
              {linkToLead ? (
                <Link href={`/leads/${e.lead_id}`} className="text-slate-900 hover:underline">
                  {text}
                </Link>
              ) : (
                text
              )}
              <span className="whitespace-nowrap text-slate-500"> · {formatDay(e.created_at, lang, t.ui)}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
