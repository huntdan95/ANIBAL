"use client";

import Link from "next/link";
import { useActionState } from "react";
import { messages, type Lang } from "@/i18n/messages";
import { STATES } from "@/lib/states";
import { SOURCES } from "@/lib/types";
import type { ErrorCode, LeadFormState } from "@/lib/leads/validate";

type Values = Record<string, string>;

const input =
  "h-12 w-full rounded-xl border bg-white px-3 text-lg focus:border-steel focus:outline-none focus:ring-2 focus:ring-steel/40";

function Field({
  name,
  label,
  value,
  error,
  type = "text",
  inputMode,
  maxLength,
}: {
  name: string;
  label: string;
  value: string;
  error?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete="off"
        maxLength={maxLength}
        defaultValue={value}
        aria-invalid={!!error}
        className={`${input} ${error ? "border-red-500" : "border-slate-300"}`}
      />
      {error && <span className="mt-1 block text-base text-red-700">{error}</span>}
    </label>
  );
}

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

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <p className="text-slate-600">{t.required}</p>
      {state.message && (
        <p className="rounded-xl border border-red-300 bg-red-50 p-3 font-semibold text-red-800">
          {t[state.message]}
        </p>
      )}

      <Field {...f("full_name")} label={t.full_name} maxLength={120} />
      <Field {...f("phone")} label={t.phone} type="tel" inputMode="tel" maxLength={20} />
      <Field {...f("email")} label={t.email} type="email" inputMode="email" maxLength={200} />
      <Field {...f("street")} label={t.street} maxLength={200} />
      <Field {...f("city")} label={t.city} maxLength={100} />

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block font-semibold">{t.state}</span>
          <select
            name="state"
            defaultValue={v.state || "TN"}
            className={`${input} ${err("state") ? "border-red-500" : "border-slate-300"}`}
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

      <Field {...f("business_name")} label={t.business_name} maxLength={200} />

      <fieldset>
        <legend className="mb-1 font-semibold">{t.language}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["es", "en"] as const).map((l) => (
            <label
              key={l}
              className="flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-lg has-[:checked]:border-navy has-[:checked]:bg-cream-light"
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

      <label className="block">
        <span className="mb-1 block font-semibold">{t.needs_notes}</span>
        <textarea
          name="needs_notes"
          rows={3}
          maxLength={2000}
          placeholder={t.needsHint}
          defaultValue={v.needs_notes ?? ""}
          className="w-full rounded-xl border border-slate-300 bg-white p-3 text-lg focus:border-steel focus:outline-none focus:ring-2 focus:ring-steel/40"
        />
      </label>

      <label className="block">
        <span className="mb-1 block font-semibold">{t.source}</span>
        <select name="source" defaultValue={v.source ?? ""} className={`${input} border-slate-300`}>
          <option value="">{t.chooseOne}</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {tSource[s]}
            </option>
          ))}
        </select>
      </label>

      {showReferrerBox && (
        <label className="flex h-12 items-center gap-3 rounded-xl border border-gold bg-cream-light px-3 text-lg">
          <input
            type="checkbox"
            name="referred_by_anibal"
            defaultChecked={v.referred_by_anibal === "on"}
            className="h-5 w-5 accent-navy"
          />
          {t.referredByAnibal}
        </label>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={pending}
          className="h-14 w-full rounded-xl bg-navy text-lg font-bold text-white hover:bg-navy-dark disabled:opacity-60 sm:flex-1"
        >
          {pending ? t.saving : t.save}
        </button>
        <Link
          href={cancelHref}
          className="flex h-14 w-full items-center justify-center rounded-xl border border-slate-300 bg-white text-lg font-semibold text-slate-700 sm:flex-1"
        >
          {t.cancel}
        </Link>
      </div>
    </form>
  );
}
