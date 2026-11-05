"use client";

import { useActionState, useEffect, useRef } from "react";
import { messages, type Lang } from "@/i18n/messages";
import { formatPhone } from "@/lib/format";
import type { IntakeFormState } from "@/lib/portal/validate";
import { STATES } from "@/lib/states";
import { anyFilled, controlClass, Field, focusFirstError, LanguageChoice } from "./form";
import { NeedsFields } from "./NeedsFields";
import { buttonClass, Fold } from "./ui";

/** The contact fields the customer must fill in. */
const REQUIRED_CONTACT = ["full_name", "phone", "street", "city", "zip"];

type Values = Record<string, string | string[]>;

/**
 * The customer's "Mi información" form. Follow-up questions appear for what they check.
 * "Sus datos" starts folded (showing what we have) when it's already complete, so the
 * customer goes straight to "what do you need to insure".
 */
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

  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "error") focusFirstError(formRef.current);
  }, [state]);

  const contactComplete = REQUIRED_CONTACT.every((k) => anyFilled(initial, [k]));
  const contactPreview = [
    str("full_name"),
    formatPhone(str("phone")),
    [str("street"), [str("city"), str("state")].filter(Boolean).join(", "), str("zip")].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      {state.message && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 font-semibold text-red-800">
          {messages[lang].form[state.message]}
        </p>
      )}

      <Fold title={t.sections.contact} hint={contactPreview} open={!contactComplete}>
        <div className="space-y-4">
          <Field {...f("full_name")} label={messages[lang].form.full_name} maxLength={120} />
          <Field {...f("phone")} label={messages[lang].form.phone} type="tel" inputMode="tel" maxLength={20} />
          <div>
            <span className="mb-1.5 block text-base font-semibold text-slate-800">{t.emailLabel}</span>
            <p className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-lg text-slate-600">
              <span className="truncate">{email}</span>
            </p>
          </div>
          <Field {...f("street")} label={`${messages[lang].form.street} *`} maxLength={200} />
          <Field {...f("city")} label={`${messages[lang].form.city} *`} maxLength={100} />
          <div className="grid grid-cols-[1.4fr_1fr] gap-3">
            <label className="block">
              <span className="mb-1.5 block text-base font-semibold text-slate-800">{messages[lang].form.state} *</span>
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
            <Field {...f("zip")} label={`${messages[lang].form.zip} *`} inputMode="numeric" maxLength={10} />
          </div>
          <LanguageChoice label={messages[lang].form.language} value={str("language")} />
        </div>
      </Fold>

      <NeedsFields lang={lang} values={v} error={err} />

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
