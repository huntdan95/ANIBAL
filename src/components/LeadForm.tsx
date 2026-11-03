"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { messages, type Lang } from "@/i18n/messages";
import type { ErrorCode, LeadFormState } from "@/lib/leads/validate";
import { STATES } from "@/lib/states";
import { SOURCES } from "@/lib/types";
import { buttonClass } from "./ui";

type Values = Record<string, string>;

const control =
  "w-full rounded-xl border bg-white px-3 text-lg shadow-sm transition placeholder:text-slate-400 focus:border-steel focus:outline-none focus:ring-2 focus:ring-steel/30";

function Field({
  name,
  label,
  value,
  error,
  type = "text",
  inputMode,
  maxLength,
  className = "",
}: {
  name: string;
  label: string;
  value: string;
  error?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-base font-semibold text-slate-800">{label}</span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete="off"
        maxLength={maxLength}
        defaultValue={value}
        aria-invalid={!!error}
        className={`${control} h-12 ${error ? "border-red-500 bg-red-50/40" : "border-slate-300"}`}
      />
      {error && <span className="mt-1 block text-base font-medium text-red-700">{error}</span>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <legend className="sr-only">{title}</legend>
      <p aria-hidden className="text-sm font-bold uppercase tracking-wider text-steel">
        {title}
      </p>
      {children}
    </fieldset>
  );
}

/** The referral form: add (Danny & Aníbal) or edit (Danny). Checked again on the server. */
export function LeadForm({
  lang,
  action,
  initial,
  showReferrerBox,
  cancelHref,
}: {
  lang: Lang;
  action: (prev: LeadFormState, fd: FormData) => Promise<LeadFormState>;
  initial: Values;
  showReferrerBox: boolean;
  cancelHref: string;
}) {
  const t = messages[lang].form;
  const tSource = messages[lang].source;
  const [state, formAction, pending] = useActionState(action, { status: "idle", errors: {} });
  const v = state.values ?? initial;
  const err = (name: string) => state.errors[name as keyof typeof state.errors] as ErrorCode | undefined;
  const f = (name: string) => ({ name, value: v[name] ?? "", error: err(name) && t.errors[err(name)!] });
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed save, jump to the first field that needs fixing.
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
          {t[state.message]}
        </p>
      )}
      <p className="text-sm text-slate-500">{t.required}</p>

      <Section title={t.sections.person}>
        <Field {...f("full_name")} label={t.full_name} maxLength={120} />
        <Field {...f("phone")} label={t.phone} type="tel" inputMode="tel" maxLength={20} />
        <Field {...f("email")} label={t.email} type="email" inputMode="email" maxLength={200} />
        <fieldset>
          <legend className="mb-1.5 text-base font-semibold text-slate-800">{t.language}</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["es", "en"] as const).map((l) => (
              <label
                key={l}
                className="flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-lg shadow-sm transition has-[:checked]:border-navy has-[:checked]:bg-cream-light has-[:checked]:font-semibold"
              >
                <input
                  type="radio"
                  name="language"
                  value={l}
                  defaultChecked={(v.language || "es") === l}
                  className="h-5 w-5 accent-navy"
                />
                {l === "es" ? "Español" : "English"}
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      <Section title={t.sections.address}>
        <Field {...f("street")} label={t.street} maxLength={200} />
        <Field {...f("city")} label={t.city} maxLength={100} />
        <div className="grid grid-cols-[1.4fr_1fr] gap-3">
          <label className="block">
            <span className="mb-1.5 block text-base font-semibold text-slate-800">{t.state}</span>
            <select
              name="state"
              defaultValue={v.state || "TN"}
              aria-invalid={!!err("state")}
              className={`${control} h-12 ${err("state") ? "border-red-500" : "border-slate-300"}`}
            >
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            {err("state") && <span className="mt-1 block text-base text-red-700">{t.errors[err("state")!]}</span>}
          </label>
          <Field {...f("zip")} label={t.zip} inputMode="numeric" maxLength={10} />
        </div>
      </Section>

      <Section title={t.sections.more}>
        <Field {...f("business_name")} label={t.business_name} maxLength={200} />
        <label className="block">
          <span className="mb-1.5 block text-base font-semibold text-slate-800">{t.needs_notes}</span>
          <textarea
            name="needs_notes"
            rows={3}
            maxLength={2000}
            placeholder={t.needsHint}
            defaultValue={v.needs_notes ?? ""}
            className={`${control} border-slate-300 py-2.5`}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-base font-semibold text-slate-800">{t.source}</span>
          <select name="source" defaultValue={v.source ?? ""} className={`${control} h-12 border-slate-300`}>
            <option value="">{t.chooseOne}</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {tSource[s]}
              </option>
            ))}
          </select>
        </label>
        {showReferrerBox && (
          <label className="flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-gold bg-cream-light px-3 text-lg">
            <input
              type="checkbox"
              name="referred_by_anibal"
              defaultChecked={v.referred_by_anibal === "on"}
              className="h-5 w-5 accent-navy"
            />
            {t.referredByAnibal}
          </label>
        )}
      </Section>

      {/* Save stays within reach while scrolling a long form. */}
      <div className="sticky bottom-0 z-20 -mx-4 flex gap-3 border-t border-slate-200 bg-paper/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Link href={cancelHref} className={buttonClass("secondary", "h-14 flex-1 text-lg")}>
          {t.cancel}
        </Link>
        <button type="submit" disabled={pending} className={buttonClass("primary", "h-14 flex-[2] text-lg")}>
          {pending && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden
            />
          )}
          {pending ? t.saving : t.save}
        </button>
      </div>
    </form>
  );
}
