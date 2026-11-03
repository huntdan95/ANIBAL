import { redirect } from "next/navigation";
import { getT } from "@/i18n/server";
import { confirmLogin } from "./actions";

/**
 * The login email links here. We ask for one tap instead of signing in right
 * away because some work email systems (like Outlook "Safe Links") open every
 * link to scan it, which would use up a one-time link before the person does.
 */
export default async function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  const { token_hash } = await searchParams;
  if (typeof token_hash !== "string" || !token_hash) redirect("/login?error=failed");
  const { t } = await getT();

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-3xl font-bold">{t.confirm.title}</h1>
      <p className="mt-2 text-lg text-slate-700">{t.confirm.note}</p>
      <form action={confirmLogin} className="mt-6">
        <input type="hidden" name="token_hash" value={token_hash} />
        <button type="submit" className="h-14 w-full rounded-xl bg-blue-800 text-lg font-bold text-white">
          {t.confirm.button}
        </button>
      </form>
    </div>
  );
}
