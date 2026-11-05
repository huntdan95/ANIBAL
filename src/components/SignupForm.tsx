"use client";

import { useActionState, useEffect, useRef } from "react";
import type { SignupState } from "@/app/r/[channel]/actions";
import { messages, type Lang } from "@/i18n/messages";
import type { SignupErrorCode } from "@/lib/signup";
import { Field, focusFirstError, LanguageChoice, Section } from "./form";
import { NeedsFields } from "./NeedsFields";
import { buttonClass } from "./ui";

/**
 * The public sign-up form: name, phone, email, language, and (optional) what they need
 * insured, so someone can request a quote in one visit.
 */
export function SignupForm({
  lang,
  action,
}: {
  lang: Lang;
  action: (prev: SignupState, fd: FormData) => Promise<SignupState>;
}) {
  const t = messages[lang].signup;
  const [state, formAction, pending] = useActionState(action, { status: "idle", errors: {} });
  const v = state.values ?? {};
  const str = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
  const err = (k: string) => {
    const code = state.errors[k] as SignupErrorCode | undefined;
    return code ? t.errors[code] : undefined;
  };

  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "error") focusFirstError(formRef.current);
  }, [state]);

  if (state.status === "done") {
    return (
      <div role="status" className="rounded-2xl border-2 border-gold bg-cream-light p-6 text-center">
        <p className="text-4xl" aria-hidden>
          {state.withInfo ? "✅" : "📬"}
        </p>
        <p className="mt-2 font-serif text-2xl text-navy">{state.withInfo ? t.doneTitleInfo : t.doneTitle}</p>
        <p className="mt-2 text-lg text-slate-700">{state.withInfo ? t.doneBodyInfo : t.doneBody}</p>
        <p className="mt-3 text-sm text-slate-500">{t.doneSpam}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="relative space-y-4" noValidate>
      {state.message && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 font-semibold text-red-800">
          {t[state.message]}
        </p>
      )}

      <Section title={messages[lang].portal.sections.contact}>
        <Field name="full_name" label={t.name} value={str("full_name")} error={err("full_name")} maxLength={80} />
        <Field
          name="phone"
          label={t.phone}
          value={str("phone")}
          error={err("phone")}
          type="tel"
          inputMode="tel"
          maxLength={20}
        />
        <Field
          name="email"
          label={t.email}
          value={str("email")}
          error={err("email")}
          type="email"
          inputMode="email"
          maxLength={200}
        />
        <LanguageChoice label={t.language} value={str("language") || lang} />
      </Section>

      <NeedsFields lang={lang} values={v} error={err} note={t.needsOptional} />

      {/* Hidden from people; bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <button type="submit" disabled={pending} className={buttonClass("primary", "h-14 w-full text-lg")}>
        {pending && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
        )}
        {pending ? t.sending : `${t.submit} →`}
      </button>
      <p className="text-center text-sm text-slate-500">🔒 {t.privacy}</p>
    </form>
  );
}
