import type { Lang, Messages } from "@/i18n/messages";
import { formatDate } from "@/lib/format";
import { progressSteps, stageRank } from "@/lib/leads/progress";
import type { Lead } from "@/lib/types";

type ProgressLead = Pick<Lead, "stage" | "contacted_at" | "info_sent_at" | "quote_sent_at" | "bound_at" | "closed_at">;

/**
 * The 4-step bar (Contactado → Info enviada → Cotización enviada → Póliza activa)
 * with the date under each finished step. Danny, Aníbal and the customer all
 * see this same bar.
 */
export function ProgressBar({ lead, t, lang }: { lead: ProgressLead; t: Messages; lang: Lang }) {
  const steps = progressSteps(lead);
  const closed = stageRank(lead.stage) < 0;

  return (
    <div>
      <ol className={`grid grid-cols-4 ${closed ? "opacity-60" : ""}`}>
        {steps.map((s, i) => {
          const nextDone = steps[i + 1]?.done ?? false;
          const isBound = s.step === "bound";
          const circle = s.done
            ? isBound
              ? "bg-gold text-navy-dark border-gold"
              : "bg-navy text-white border-navy"
            : "bg-white text-slate-400 border-slate-300";
          const label = t.progress[s.step];
          return (
            <li key={s.step} className="flex flex-col items-center text-center">
              <div className="flex w-full items-center" aria-hidden>
                <span className={`h-1 flex-1 ${i === 0 ? "invisible" : s.done ? "bg-navy" : "bg-slate-200"}`} />
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${circle}`}
                >
                  {s.done ? "✓" : i + 1}
                </span>
                <span
                  className={`h-1 flex-1 ${i === steps.length - 1 ? "invisible" : nextDone ? "bg-navy" : "bg-slate-200"}`}
                />
              </div>
              <span
                className={`mt-1 px-0.5 text-xs font-semibold leading-tight ${s.done ? "text-navy" : "text-slate-500"}`}
              >
                {label}
              </span>
              {s.date && <span className="text-xs text-slate-500">{formatDate(s.date, lang)}</span>}
              <span className="sr-only">{s.done ? " ✓" : ""}</span>
            </li>
          );
        })}
      </ol>
      {closed && (
        <p className="mt-2 text-center text-sm font-semibold text-slate-600">
          {t.stage[lead.stage]}
          {lead.closed_at ? ` · ${formatDate(lead.closed_at, lang)}` : ""}
        </p>
      )}
    </div>
  );
}
