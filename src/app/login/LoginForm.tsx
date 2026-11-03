"use client";

import { useActionState, useState } from "react";
import { messages, type Lang } from "@/i18n/messages";
import { requestLoginLink, type LoginState } from "./actions";

export function LoginForm({ lang }: { lang: Lang }) {
  const t = messages[lang].login;
  const [state, formAction, pending] = useActionState<LoginState, FormData>(requestLoginLink, {
    status: "idle",
  });
  const [dismissed, setDismissed] = useState(false);

  if (state.status === "sent" && !dismissed && !pending) {
    return (
      <div className="rounded-xl border border-gold bg-cream-light p-5">
        <h2 className="font-serif text-xl text-navy">{t.sentTitle}</h2>
        <p className="mt-2 text-lg text-navy-dark">{t.sent}</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-4 text-base font-semibold text-navy underline"
        >
          {t.tryAgain}
        </button>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        setDismissed(false);
        formAction(fd);
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="mb-1 block text-base font-semibold">{t.emailLabel}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg focus:border-steel focus:outline-none focus:ring-2 focus:ring-steel/40"
        />
      </label>
      {state.status === "invalid" && <p className="text-base font-semibold text-red-700">{t.invalidEmail}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-14 w-full rounded-xl bg-navy text-lg font-bold text-white hover:bg-navy-dark disabled:opacity-60"
      >
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
