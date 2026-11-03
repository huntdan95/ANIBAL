import type { Metadata, Viewport } from "next";
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
  themeColor: "#1e3a8a",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { lang, t } = await getT();
  const profile = await getProfile();
  const other = lang === "es" ? "en" : "es";

  return (
    <html lang={lang}>
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
            <Link href="/" className="text-lg font-bold text-blue-900">
              {t.app.name}
            </Link>
            <div className="flex items-center gap-2">
              <form action={setLanguage}>
                <input type="hidden" name="lang" value={other} />
                <button
                  type="submit"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700"
                  aria-label={t.lang.switchTo}
                >
                  {t.lang.switchToShort}
                </button>
              </form>
              {profile && (
                <form action={signOut}>
                  <button type="submit" className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-600">
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
