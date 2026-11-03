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
