"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { messages, type Lang } from "@/i18n/messages";
import type { ErrorCode, LeadFormState } from "@/lib/leads/validate";
import { STATES } from "@/lib/states";
import { SOURCES } from "@/lib/types";
import { anyFilled, controlClass as control, Field, focusFirstError, LanguageChoice, Section } from "./form";
import { buttonClass, Fold } from "./ui";

type Values = Record<string, string>;

/**
 * The referral form: add (Danny & Aníbal) or edit (Danny). Checked again on the server.
 * Only name, phone and email are required, so everything optional starts folded away.
 */
export function LeadForm({
  lang,
  action,
  initial,
  cancelHref,
}: {
  lang: Lang;
  action: (prev: LeadFormState, fd: FormData) => Promise<LeadFormState>;
  initial: Values;
  cancelHref: string;
}) {
  const t = messages[lang].form;
  const tSource = messages[lang].source;
  const [state, formAction, pending] = useActionState(action, { status: "idle", errors: {} });
  const v = state.values ?? initial;
  const err = (name: string) => state.errors[name as keyof typeof state.errors] as ErrorCode | undefined;
  const f = (name: string) => ({ name, value: v[name] ?? "", error: err(name) && t.errors[err(name)!] });
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed save, jump to the first field that needs fixing (opening its fold).
  useEffect(() => {
    if (state.status === "error") focusFirstError(formRef.current);
  }, [state]);

  // What's already filled in shows on the folded row, so nothing is hidden by surprise.
  const addressPreview = anyFilled(v, ["street", "city", "zip"])
    ? [v.street, [v.city, v.state].filter(Boolean).join(", "), v.zip].filter(Boolean).join(" · ")
    : null;
  const morePreview = [v.business_name, v.needs_notes].filter((x) => x?.trim()).join(" · ") || null;

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
        <LanguageChoice label={t.language} value={v.language} />
      </Section>

      <Fold title={t.sections.address} hint={addressPreview ?? t.sections.addressHint}>
        <div className="space-y-4">
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
        </div>
      </Fold>

      <Fold title={t.sections.more} hint={morePreview ?? t.sections.moreHint}>
        <div className="space-y-4">
          <Field {...f("business_name")} label={t.business_name} maxLength={200} />
          <label className="block">
            <span className="mb-1.5 block text-base font-semibold text-slate-800">{t.needs_notes}</span>
            <textarea
              name="needs_notes"
              rows={3}
              maxLength={2000}
              placeholder={t.needsHint}
              defaultValue={v.needs_notes ?? ""}
              aria-invalid={!!err("needs_notes")}
              className={`${control} py-2.5 ${err("needs_notes") ? "border-red-500" : "border-slate-300"}`}
            />
            {err("needs_notes") && (
              <span className="mt-1 block text-base font-medium text-red-700">{t.errors[err("needs_notes")!]}</span>
            )}
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
        </div>
      </Fold>

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
