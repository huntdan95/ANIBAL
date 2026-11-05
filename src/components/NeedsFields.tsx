"use client";

import { useState } from "react";
import { messages, type Lang } from "@/i18n/messages";
import { NEEDS, type Need } from "@/lib/portal/validate";
import { controlClass, Field, Section } from "./form";

const ICON: Record<Need, string> = { business: "🏢", workers: "👷", vehicle: "🚚", home: "🏠", other: "➕" };

type Values = Record<string, string | string[] | undefined>;

/**
 * "¿Qué necesita asegurar?" tiles plus the follow-up questions for whatever is checked.
 * Shared by the customer's "Mi información" form and the public sign-up page.
 */
export function NeedsFields({
  lang,
  values,
  error,
  note,
}: {
  lang: Lang;
  values: Values;
  /** error text for a field name, if any */
  error: (name: string) => string | undefined;
  /** extra line under the heading (e.g. "optional" on the public page) */
  note?: string;
}) {
  const t = messages[lang].portal;
  const str = (k: string) => (typeof values[k] === "string" ? (values[k] as string) : "");
  const f = (name: string) => ({ name, value: str(name), error: error(name) });

  const [needs, setNeeds] = useState<Need[]>(() => (Array.isArray(values.needs) ? (values.needs as Need[]) : []));
  const has = (n: Need) => needs.includes(n);
  const toggle = (n: Need) => setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));

  return (
    <>
      <Section title={t.sections.needs}>
        <p className="-mt-2 text-slate-600">{note ?? t.needsHint}</p>
        <div className="grid grid-cols-2 gap-3" aria-invalid={!!error("needs")}>
          {NEEDS.map((n) => (
            <label
              key={n}
              className={`flex min-h-20 cursor-pointer flex-col items-start justify-center gap-1 rounded-xl border-2 p-3 text-base font-semibold transition ${
                has(n) ? "border-navy bg-cream-light text-navy" : "border-slate-200 bg-white text-slate-700"
              } ${n === "other" ? "col-span-2 min-h-14 flex-row items-center justify-start gap-3" : ""}`}
            >
              <input
                type="checkbox"
                name="needs"
                value={n}
                checked={has(n)}
                onChange={() => toggle(n)}
                className="sr-only"
              />
              <span className="text-2xl" aria-hidden>
                {ICON[n]}
              </span>
              <span className="flex items-center gap-2">
                {t.needs[n]}
                {has(n) && <span aria-hidden>✓</span>}
              </span>
            </label>
          ))}
        </div>
        {error("needs") && <p className="text-base font-medium text-red-700">{error("needs")}</p>}
      </Section>

      <Section title={t.sections.business} hidden={!(has("business") || has("workers"))}>
        <p className="-mt-2 text-sm text-slate-500">{t.optional}</p>
        <Field {...f("business_name")} label={messages[lang].form.business_name} maxLength={200} />
        <Field {...f("work_type")} label={t.work_type} placeholder={t.workTypeHint} maxLength={200} />
        <Field {...f("weekly_payroll")} label={t.weekly_payroll} prefix="$" inputMode="decimal" maxLength={12} />
        <Field {...f("weeks_per_year")} label={t.weeks_per_year} inputMode="numeric" maxLength={2} />
      </Section>

      <Section title={t.sections.home} hidden={!has("home")}>
        <Field {...f("roof_year")} label={t.roof_year} hint={t.roofHint} inputMode="numeric" maxLength={4} />
      </Section>

      <Section title={t.sections.vehicles} hidden={!has("vehicle")}>
        <div className="grid grid-cols-2 gap-3">
          <Field {...f("vehicle_count")} label={t.vehicle_count} inputMode="numeric" maxLength={2} />
          <Field {...f("driver_count")} label={t.driver_count} inputMode="numeric" maxLength={2} />
        </div>
      </Section>

      <Section title={t.sections.other} hidden={!has("other")}>
        <label className="block">
          <span className="mb-1.5 block text-base font-semibold text-slate-800">{t.other_need}</span>
          <textarea
            name="other_need"
            rows={2}
            maxLength={500}
            defaultValue={str("other_need")}
            className={`${controlClass} border-slate-300 py-2.5`}
          />
        </label>
      </Section>
    </>
  );
}
