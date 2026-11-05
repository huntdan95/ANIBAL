// Form building blocks shared by the referral form and the customer's form.
import type { ReactNode } from "react";

export const controlClass =
  "w-full rounded-xl border bg-white px-3 text-lg shadow-sm transition placeholder:text-slate-400 focus:border-steel focus:outline-none focus:ring-2 focus:ring-steel/30";

export function Field({
  name,
  label,
  value,
  error,
  hint,
  prefix,
  type = "text",
  inputMode,
  maxLength,
  placeholder,
  className = "",
}: {
  name: string;
  label: string;
  value: string;
  error?: string;
  hint?: string;
  prefix?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-base font-semibold text-slate-800">{label}</span>
      <span className="relative block">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-500">
            {prefix}
          </span>
        )}
        <input
          name={name}
          type={type}
          inputMode={inputMode}
          autoComplete="off"
          maxLength={maxLength}
          placeholder={placeholder}
          defaultValue={value}
          aria-invalid={!!error}
          className={`${controlClass} h-12 ${prefix ? "pl-7" : ""} ${error ? "border-red-500 bg-red-50/40" : "border-slate-300"}`}
        />
      </span>
      {hint && !error && <span className="mt-1 block text-sm text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-base font-medium text-red-700">{error}</span>}
    </label>
  );
}

export function Section({ title, children, hidden }: { title: string; children: ReactNode; hidden?: boolean }) {
  return (
    <fieldset hidden={hidden} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <legend className="sr-only">{title}</legend>
      <p aria-hidden className="text-sm font-bold uppercase tracking-wider text-steel">
        {title}
      </p>
      {children}
    </fieldset>
  );
}

/**
 * After a failed save, jump to the first field that needs fixing. Opens any
 * folded section it's in first, so the error is never hidden.
 */
export function focusFirstError(form: HTMLFormElement | null) {
  const first = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!first) return;
  for (let d = first.closest("details"); d; d = d.parentElement?.closest("details") ?? null) d.open = true;
  first.scrollIntoView({ behavior: "smooth", block: "center" });
  first.focus({ preventScroll: true });
}

/** True when any of these form values has something typed in. */
export function anyFilled(values: Record<string, unknown>, names: string[]) {
  return names.some((n) => {
    const v = values[n];
    return typeof v === "string" ? v.trim() !== "" : Array.isArray(v) && v.length > 0;
  });
}

/** Big Español / English choice. */
export function LanguageChoice({ label, value }: { label: string; value: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-base font-semibold text-slate-800">{label}</legend>
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
              defaultChecked={(value || "es") === l}
              className="h-5 w-5 accent-navy"
            />
            {l === "es" ? "Español" : "English"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
