// Small shared building blocks so every screen looks and behaves the same.
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-navy text-white shadow-sm hover:bg-navy-dark",
  secondary: "border border-navy/30 bg-white text-navy hover:border-navy",
  quiet: "text-steel hover:text-navy",
  danger: "border border-slate-300 bg-white text-slate-700 hover:border-slate-500",
};

/** Class names for a big, thumb-friendly button or button-styled link. */
export function buttonClass(variant: Variant = "primary", extra = "") {
  return `inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-bold transition active:scale-[0.98] disabled:opacity-60 ${variants[variant]} ${extra}`;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

/** The ▾ on a fold. It turns over only when its own fold is open (globals.css), so folds can sit inside folds. */
export function Chevron() {
  return (
    <span className="fold-chevron inline-block shrink-0 text-steel transition" aria-hidden>
      ▾
    </span>
  );
}

/**
 * A card that folds away so long pages stay short: a big tap-to-open title row
 * with an optional one-line hint of what's inside. Closed unless `open`.
 * Fields inside a closed fold are still sent with the form.
 */
export function Fold({
  title,
  hint,
  open = false,
  id,
  variant = "card",
  bodyClassName,
  children,
}: {
  title: ReactNode;
  hint?: ReactNode;
  open?: boolean;
  id?: string;
  /** card: a page card · inset: lighter, sits inside another card · dashed: Danny-only details */
  variant?: "card" | "inset" | "dashed";
  bodyClassName?: string;
  children: ReactNode;
}) {
  const inset = variant === "inset";
  const shell = {
    card: "rounded-2xl border border-slate-200/80 bg-white shadow-sm",
    inset: "rounded-xl border border-slate-200 bg-cream-light/60",
    dashed: "rounded-2xl border-2 border-dashed border-navy/25 bg-white shadow-sm",
  }[variant];
  const pad = inset ? "px-3" : "px-4";
  return (
    <details id={id} open={open} className={`scroll-mt-24 ${shell}`}>
      <summary className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 py-3 ${pad}`}>
        <span className="min-w-0">
          <span className={`block font-bold text-navy ${inset ? "text-base" : "text-lg"}`}>{title}</span>
          {hint && <span className="line-clamp-2 text-sm text-slate-500">{hint}</span>}
        </span>
        <Chevron />
      </summary>
      <div className={bodyClassName ?? `${pad} ${inset ? "pb-3" : "pb-4"}`}>{children}</div>
    </details>
  );
}

export function Notice({
  kind = "success",
  children,
}: {
  kind?: "success" | "error" | "warning";
  children: ReactNode;
}) {
  const style = {
    success: "border-gold/60 bg-cream-light text-navy-dark",
    error: "border-red-300 bg-red-50 text-red-800",
    warning: "border-amber-300 bg-amber-50 text-amber-900",
  }[kind];
  const icon = { success: "✓", error: "!", warning: "⚠" }[kind];
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-xl border p-3 font-semibold ${style}`}
    >
      <span aria-hidden>{icon}</span>
      <span>{children}</span>
    </p>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <h1 className="font-serif text-3xl leading-tight text-navy">{children}</h1>
      {sub && <p className="mt-1 text-base text-slate-600">{sub}</p>}
    </div>
  );
}
