import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { getT } from "@/i18n/server";
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
      <body className="min-h-dvh bg-paper font-sans text-slate-900 antialiased">
        <header className="border-b-[3px] border-gold bg-white">
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/ipt-shield.png" alt="IPT" width={34} height={40} priority />
              <span className="font-serif text-xl tracking-wide text-navy">{t.app.name}</span>
            </Link>
            <div className="flex items-center gap-2">
              <form action={setLanguage}>
                <input type="hidden" name="lang" value={other} />
                <button
                  type="submit"
                  className="h-10 rounded-lg border border-steel/50 px-3 text-sm font-semibold text-navy"
                  aria-label={t.lang.switchTo}
                >
                  {t.lang.switchToShort}
                </button>
              </form>
              {profile && (
                <form action={signOut}>
                  <button type="submit" className="h-10 rounded-lg px-3 text-sm font-semibold text-steel">
                    {t.nav.logout}
                  </button>
                </form>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
