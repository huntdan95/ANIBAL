import type { Lang, Messages } from "@/i18n/messages";
import { formatDate } from "@/lib/format";
import type { Intake } from "@/lib/portal/queries";
import { Card } from "./ui";

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/** Danny's read-only view of what the customer sent with "Enviar a Danny". */
export function CustomerAnswers({ intake, t, lang }: { intake: Intake | null; t: Messages; lang: Lang }) {
  const a = t.answers;
  if (!intake) {
    return (
      <Card>
        <h2 className="text-sm font-bold uppercase tracking-wider text-steel">{a.title}</h2>
        <p className="mt-2 text-slate-600">{a.none}</p>
      </Card>
    );
  }
  const rows: [string, string | null][] = [
    [a.needs, intake.needs.map((n) => t.portal.needs[n]).join(", ")],
    [a.work_type, intake.work_type],
    [a.payroll, intake.weekly_payroll != null ? usd(intake.weekly_payroll) : null],
    [a.weeks, intake.weeks_per_year != null ? String(intake.weeks_per_year) : null],
    [a.roof, intake.roof_year != null ? String(intake.roof_year) : null],
    [a.vehicles, intake.vehicle_count != null ? String(intake.vehicle_count) : null],
    [a.drivers, intake.driver_count != null ? String(intake.driver_count) : null],
    [a.other, intake.other_need],
  ];
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-steel">{a.title}</h2>
        <span className="text-sm text-slate-500">{a.sentOn(formatDate(intake.submitted_at, lang))}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        {rows
          .filter(([, v]) => v)
          .map(([label, value], i) => (
            <div key={label} className={i === 0 ? "col-span-2" : ""}>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
              <dd className="mt-0.5 text-slate-800">{value}</dd>
            </div>
          ))}
      </dl>
    </Card>
  );
}
