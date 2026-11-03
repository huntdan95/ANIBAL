import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { AGENT } from "@/lib/agent";
import { getProfile } from "@/lib/auth";
import { setLanguage, signOut } from "./actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPT Referidos",
  description: "Insurance Professionals of Tennessee",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#22506b",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { lang, t } = await getT();
  const profile = await getProfile();
  const other = lang === "es" ? "en" : "es";

  return (
    <html lang={lang}>
      <body className="flex min-h-dvh flex-col bg-paper font-sans text-slate-900 antialiased">
        <header className="sticky top-0 z-30 border-b-[3px] border-gold bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <Image src="/ipt-shield.png" alt="IPT" width={32} height={38} priority />
              <span className="truncate font-serif text-xl tracking-wide text-navy">{t.app.name}</span>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              {/* One button that flips the language; the current one is highlighted. */}
              <form action={setLanguage}>
                <input type="hidden" name="lang" value={other} />
                <button
                  type="submit"
                  aria-label={t.lang.switchTo}
                  className="flex h-10 items-center rounded-full border border-slate-300 bg-white p-1 text-sm font-bold"
                >
                  {(["es", "en"] as const).map((l) => (
                    <span
                      key={l}
                      className={`rounded-full px-2.5 py-1 ${l === lang ? "bg-navy text-white" : "text-slate-500"}`}
                    >
                      {l.toUpperCase()}
                    </span>
                  ))}
                </button>
              </form>
              {profile && (
                <form action={signOut}>
                  <button
                    type="submit"
                    className="h-10 rounded-lg px-2.5 text-sm font-semibold text-steel hover:text-navy"
                  >
                    {t.nav.logout}
                  </button>
                </form>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-5">{children}</main>

        <footer className="border-t border-slate-200 bg-white/60">
          <div className="mx-auto max-w-3xl px-4 py-4 text-center text-sm text-slate-500">
            {t.ui.footer} ·{" "}
            <a href={AGENT.phoneHref} className="whitespace-nowrap font-semibold text-navy">
              {AGENT.phone}
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
