import Image from "next/image";
import { redirect } from "next/navigation";
import { getT } from "@/i18n/server";
import { AGENT } from "@/lib/agent";
import { getProfile, homeFor } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const profile = await getProfile();
  if (profile) redirect(homeFor(profile.role));

  const { lang, t } = await getT();
  const { error } = await searchParams;
  const notice = error === "expired" ? t.login.expired : error === "failed" ? t.login.failed : null;

  return (
    <div className="mx-auto max-w-md pt-2">
      <Image
        src="/ipt-logo.png"
        alt={t.app.agency}
        width={768}
        height={417}
        priority
        className="mx-auto mb-6 h-auto w-52"
      />
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h1 className="font-serif text-3xl text-navy">{t.login.title}</h1>
        <p className="mt-2 text-lg text-slate-700">{t.login.intro}</p>
        {notice && (
          <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-base font-semibold text-amber-900">
            {notice}
          </p>
        )}
        <div className="mt-6">
          <LoginForm lang={lang} />
        </div>
      </div>
      <p className="mt-6 text-center text-base text-slate-600">
        {t.login.help}{" "}
        <a href={AGENT.phoneHref} className="whitespace-nowrap font-semibold text-navy underline">
          {AGENT.phone}
        </a>
      </p>
    </div>
  );
}
