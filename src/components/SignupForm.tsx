"use client";

import { useActionState } from "react";
import type { SignupState } from "@/app/r/[channel]/actions";
import { messages, type Lang } from "@/i18n/messages";
import { Field, LanguageChoice } from "./form";
import { buttonClass } from "./ui";

/** The public sign-up form (name, phone, email, language). */
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
  const err = (k: keyof SignupState["errors"]) => (state.errors[k] ? t.errors[state.errors[k]!] : undefined);

  if (state.status === "done") {
    return (
      <div role="status" className="rounded-xl bg-cream-light p-6 text-center">
        <p className="text-4xl" aria-hidden>
          📬
        </p>
        <p className="mt-2 font-serif text-2xl text-navy">{t.doneTitle}</p>
        <p className="mt-2 text-lg text-slate-700">{t.doneBody}</p>
        <p className="mt-3 text-sm text-slate-500">{t.doneSpam}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 font-semibold text-red-800">
          {t[state.message]}
        </p>
      )}
      <Field name="full_name" label={t.name} value={v.full_name ?? ""} error={err("full_name")} maxLength={80} />
      <Field
        name="phone"
        label={t.phone}
        value={v.phone ?? ""}
        error={err("phone")}
        type="tel"
        inputMode="tel"
        maxLength={20}
      />
      <Field
        name="email"
        label={t.email}
        value={v.email ?? ""}
        error={err("email")}
        type="email"
        inputMode="email"
        maxLength={200}
      />
      <LanguageChoice label={t.language} value={v.language ?? lang} />

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
