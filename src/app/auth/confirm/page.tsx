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
    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm">
      <h1 className="font-serif text-3xl text-navy">{t.confirm.title}</h1>
      <p className="mt-2 text-lg text-slate-700">{t.confirm.note}</p>
      <form action={confirmLogin} className="mt-6">
        <input type="hidden" name="token_hash" value={token_hash} />
        <button
          type="submit"
          className="h-14 w-full rounded-xl bg-navy text-lg font-bold text-white shadow-sm transition hover:bg-navy-dark active:scale-[0.98]"
        >
          {t.confirm.button}
        </button>
      </form>
    </div>
  );
}
