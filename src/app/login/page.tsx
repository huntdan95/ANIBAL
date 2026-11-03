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
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold">{t.login.title}</h1>
      <p className="mt-2 text-lg text-slate-700">{t.login.intro}</p>
      {notice && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-base font-semibold text-amber-900">
          {notice}
        </p>
      )}
      <div className="mt-6">
        <LoginForm lang={lang} />
      </div>
      <p className="mt-8 text-base text-slate-600">
        {t.login.help}{" "}
        <a href={AGENT.phoneHref} className="whitespace-nowrap font-semibold text-blue-800 underline">
          {AGENT.phone}
        </a>
      </p>
    </div>
  );
}
