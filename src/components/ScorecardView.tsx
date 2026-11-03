import type { Messages } from "@/i18n/messages";
import type { Scorecard } from "@/lib/scorecard";
import { Card, PageTitle } from "./ui";

// Single-hue charts (IPT navy on white; contrast checked with the dataviz validator).
// One series each, so no legend: the card title says what's plotted. Text stays in
// text colors; only the marks are navy.

/** Danny's scorecard: one headline number, how far referrals got, and where they came from. */
export function ScorecardView({ score, t }: { score: Scorecard; t: Messages }) {
  const s = t.score;
  const max = Math.max(1, ...score.bySource.map((b) => b.count));
  const sourceName = (src: Scorecard["bySource"][number]["source"]) => (src ? t.source[src] : s.unknown);

  return (
    <div className="space-y-4">
      <PageTitle sub={s.sub}>{s.title}</PageTitle>

      <Card>
        <p className="text-base text-slate-600">{s.referrals}</p>
        <p className="mt-1 text-6xl font-semibold leading-none tracking-tight text-slate-900">{score.total}</p>
      </Card>

      {score.total === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-lg text-slate-600">
          {s.empty}
        </p>
      ) : (
        <>
          <Card>
            <h2 className="text-sm font-bold uppercase tracking-wider text-steel">{s.funnelTitle}</h2>
            <ul className="mt-4 space-y-4">
              {score.steps.map(({ step, count, pct }) => (
                <li key={step}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-semibold text-slate-800">{s.steps[step]}</span>
                    <span className="text-2xl font-semibold text-slate-900">{pct}%</span>
                  </div>
                  <div
                    role="meter"
                    aria-label={`${s.steps[step]}: ${pct}%, ${s.of(count, score.total)}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                    className="mt-1.5 h-3 overflow-hidden rounded-full bg-navy/10"
                  >
                    <div className="h-full rounded-full bg-navy" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{s.of(count, score.total)}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="text-sm font-bold uppercase tracking-wider text-steel">{s.bySource}</h2>
            <ul className="mt-4 space-y-3">
              {score.bySource.map((b) => {
                const name = sourceName(b.source);
                const tip = `${name}: ${s.leadsWord(b.count)} (${b.pct}%)`;
                return (
                  <li
                    key={b.source ?? "none"}
                    tabIndex={0}
                    aria-label={tip}
                    className="group relative grid grid-cols-[minmax(6rem,9rem)_1fr] items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-steel/50"
                  >
                    <span className="text-base leading-tight text-slate-700">{name}</span>
                    <span className="flex items-center gap-2">
                      {/* ≤24px thick, square at the baseline, 4px rounded data end */}
                      <span
                        className="h-6 rounded-r-[4px] bg-navy transition group-hover:bg-navy-dark"
                        style={{ width: `${(b.count / max) * 80}%` }}
                      />
                      <span className="text-base font-semibold text-slate-900">{b.count}</span>
                    </span>
                    {/* hover / keyboard-focus tooltip */}
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute -top-9 left-24 z-10 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-sm text-white shadow group-hover:block group-focus-visible:block"
                    >
                      {tip}
                    </span>
                  </li>
                );
              })}
            </ul>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-steel">{s.tableView} ▾</summary>
              <table className="mt-2 w-full text-left text-base tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="py-1.5 font-semibold">{s.channel}</th>
                    <th className="py-1.5 text-right font-semibold">{s.count}</th>
                    <th className="py-1.5 text-right font-semibold">{s.share}</th>
                  </tr>
                </thead>
                <tbody>
                  {score.bySource.map((b) => (
                    <tr key={b.source ?? "none"} className="border-b border-slate-100">
                      <td className="py-1.5">{sourceName(b.source)}</td>
                      <td className="py-1.5 text-right">{b.count}</td>
                      <td className="py-1.5 text-right">{b.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </Card>
        </>
      )}
    </div>
  );
}
