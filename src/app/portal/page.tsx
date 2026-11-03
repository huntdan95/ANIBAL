import { getT } from "@/i18n/server";
import { AGENT } from "@/lib/agent";
import { requireRole } from "@/lib/auth";

// The customer's own file. "Mi información" and "Mis cotizaciones" come in steps 6–7.
export default async function PortalPage() {
  const profile = await requireRole("customer");
  const { t } = await getT();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t.portal.hello(profile.full_name ?? "")}</h1>
      <p className="mt-2 text-slate-600">{t.common.comingSoon}</p>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold">{t.portal.contactTitle}</h2>
        <p className="mt-1 text-lg">
          {AGENT.name} · {AGENT.agency}
        </p>
        <p className="text-lg">
          <a href={AGENT.phoneHref} className="whitespace-nowrap font-semibold text-blue-800 underline">
            {AGENT.phone}
          </a>
        </p>
        <p className="text-lg">
          <a href={`mailto:${AGENT.email}`} className="text-blue-800 underline">
            {AGENT.email}
          </a>
        </p>
      </section>
    </div>
  );
}
