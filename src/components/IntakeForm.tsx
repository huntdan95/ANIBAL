"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { messages, type Lang } from "@/i18n/messages";
import { NEEDS, type IntakeFormState, type Need } from "@/lib/portal/validate";
import { STATES } from "@/lib/states";
import { controlClass, Field, LanguageChoice, Section } from "./form";
import { buttonClass } from "./ui";

const ICON: Record<Need, string> = { business: "🏢", workers: "👷", vehicle: "🚚", home: "🏠", other: "➕" };

type Values = Record<string, string | string[]>;

/** The customer's "Mi información" form. Follow-up questions appear for what they check. */
export function IntakeForm({
  lang,
  action,
  initial,
  email,
}: {
  lang: Lang;
  action: (prev: IntakeFormState, fd: FormData) => Promise<IntakeFormState>;
  initial: Values;
  email: string;
}) {
  const t = messages[lang].portal;
  const [state, formAction, pending] = useActionState(action, { status: "idle", errors: {} });
  const v = state.values ?? initial;
  const str = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
  const err = (k: string) => {
    const code = state.errors[k];
    return code ? t.errors[code] : undefined;
  };
  const f = (name: string) => ({ name, value: str(name), error: err(name) });

  const [needs, setNeeds] = useState<Need[]>(() => (Array.isArray(initial.needs) ? (initial.needs as Need[]) : []));
  const has = (n: Need) => needs.includes(n);
  const toggle = (n: Need) => setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));

  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status !== "error") return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (first) {
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      first.focus({ preventScroll: true });
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      {state.message && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 font-semibold text-red-800">
          {messages[lang].form[state.message]}
        </p>
      )}

      <Section title={t.sections.contact}>
        <Field {...f("full_name")} label={messages[lang].form.full_name} maxLength={120} />
        <Field {...f("phone")} label={messages[lang].form.phone} type="tel" inputMode="tel" maxLength={20} />
        <div>
          <span className="mb-1.5 block text-base font-semibold text-slate-800">{t.emailLabel}</span>
          <p className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-lg text-slate-600">
            <span className="truncate">{email}</span>
          </p>
        </div>
        <Field {...f("street")} label={messages[lang].form.street} maxLength={200} />
        <Field {...f("city")} label={messages[lang].form.city} maxLength={100} />
        <div className="grid grid-cols-[1.4fr_1fr] gap-3">
          <label className="block">
            <span className="mb-1.5 block text-base font-semibold text-slate-800">{messages[lang].form.state}</span>
            <select
              name="state"
              defaultValue={str("state") || "TN"}
              className={`${controlClass} h-12 border-slate-300`}
            >
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <Field {...f("zip")} label={messages[lang].form.zip} inputMode="numeric" maxLength={10} />
        </div>
        <LanguageChoice label={messages[lang].form.language} value={str("language")} />
      </Section>

      <Section title={t.sections.needs}>
        <p className="-mt-2 text-slate-600">{t.needsHint}</p>
        <div className="grid grid-cols-2 gap-3" aria-invalid={!!err("needs")}>
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
        {err("needs") && <p className="text-base font-medium text-red-700">{err("needs")}</p>}
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

      <p className="flex gap-2 rounded-xl bg-white/70 p-3 text-sm text-slate-600">
        <span aria-hidden>🔒</span>
        {t.privacy}
      </p>

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-paper/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <button type="submit" disabled={pending} className={buttonClass("primary", "h-14 w-full text-lg")}>
          {pending && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden
            />
          )}
          {pending ? t.sending : `${t.submit} →`}
        </button>
      </div>
    </form>
  );
}
