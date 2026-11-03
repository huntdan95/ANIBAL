import type { Messages } from "@/i18n/messages";
import { planPings, stageChangeEvent } from "@/lib/notify/plan";
import { CLOSED_STAGES, STAGES, type Lead, type Stage } from "@/lib/types";
import { SubmitButton } from "./SubmitButton";

type Action = (fd: FormData) => Promise<void>;

function StageForm({
  to,
  label,
  variant = "primary",
  setStage,
  pendingLabel,
}: {
  to: Stage;
  label: string;
  variant?: "primary" | "danger" | "secondary";
  setStage: Action;
  pendingLabel: string;
}) {
  return (
    <form action={setStage} className="flex-1">
      <input type="hidden" name="stage" value={to} />
      <SubmitButton variant={variant} pendingLabel={pendingLabel} className="h-13 w-full text-lg">
        {label}
      </SubmitButton>
    </form>
  );
}

/**
 * Danny's "Siguiente paso" card: the one obvious button for where the lead is,
 * plus a plain note of who will get an email. Closing and manual changes are
 * tucked away so they aren't tapped by accident.
 */
export function NextStep({ lead, t, setStage }: { lead: Lead; t: Messages; setStage: Action }) {
  const n = t.lead.next;
  const referred = Boolean(lead.referrer_id);

  const emailNote = (to: Stage) => {
    const event = stageChangeEvent(lead.stage, to);
    const who = event ? [...new Set(planPings(event, { referred }).map((p) => n.who[p.to]))] : [];
    return who.length ? n.willEmail(who.join(` ${n.who.and} `)) : n.noEmail;
  };

  const go = { setStage, pendingLabel: t.form.saving };

  const isClosed = CLOSED_STAGES.includes(lead.stage);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-steel">{n.title}</h2>

      {lead.stage === "new" && (
        <>
          <StageForm {...go} to="contacted" label={n.markContacted} />
          <p className="text-sm text-slate-500">{emailNote("contacted")}</p>
        </>
      )}
      {lead.stage === "contacted" && <p className="text-base text-slate-700">⏳ {n.waitingInfo}</p>}
      {lead.stage === "info_sent" && <p className="text-base font-semibold text-navy">📄 {n.prepareQuote}</p>}
      {lead.stage === "quote_sent" && (
        <>
          <StageForm {...go} to="bound" label={n.markBound} />
          <p className="text-sm text-slate-500">{emailNote("bound")}</p>
        </>
      )}
      {lead.stage === "bound" && (
        <p className="rounded-xl bg-cream-light p-3 text-base font-bold text-gold-dark">🎉 {n.boundDone}</p>
      )}
      {isClosed && (
        <>
          <p className="text-base text-slate-600">{n.closedNote}</p>
          <StageForm {...go} to="new" label={n.reopen} variant="secondary" />
        </>
      )}

      {!isClosed && lead.stage !== "bound" && (
        <details className="group rounded-xl border border-slate-200">
          <summary className="flex h-12 cursor-pointer items-center justify-between px-3 font-semibold text-slate-600">
            {n.closeTitle}
            <span className="inline-block transition group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="space-y-2 px-3 pb-3">
            <div className="flex gap-2">
              <StageForm {...go} to="not_bought" label={n.notBought} variant="danger" />
              <StageForm {...go} to="not_fit" label={n.notFit} variant="danger" />
            </div>
            <p className="text-sm text-slate-500">{emailNote("not_bought")}</p>
          </div>
        </details>
      )}

      <details className="group">
        <summary className="flex cursor-pointer items-center gap-1 text-sm font-semibold text-steel">
          {n.manual}
          <span className="inline-block transition group-open:rotate-180" aria-hidden>
            ▾
          </span>
        </summary>
        <form action={setStage} className="mt-2 flex gap-2">
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
          <SubmitButton pendingLabel={t.form.saving} variant="secondary">
            {t.lead.saveStage}
          </SubmitButton>
        </form>
        <p className="mt-1 text-xs text-slate-500">{t.lead.autoHint}</p>
      </details>
    </div>
  );
}
