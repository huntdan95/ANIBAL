import { getT } from "@/i18n/server";
import { AGENT } from "@/lib/agent";
import { requireRole } from "@/lib/auth";

// The customer's own file. "Mi información" and "Mis cotizaciones" come in steps 6–7.
export default async function PortalPage() {
  const profile = await requireRole("customer");
  const { t } = await getT();
  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">{t.portal.hello(profile.full_name ?? "")}</h1>
      <p className="mt-2 text-slate-600">{t.common.comingSoon}</p>
      <section className="mt-6 rounded-xl border-l-4 border-gold bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-navy">{t.portal.contactTitle}</h2>
        <p className="mt-1 text-lg">
          {AGENT.name} · {AGENT.agency}
        </p>
        <p className="text-lg">
          <a href={AGENT.phoneHref} className="whitespace-nowrap font-semibold text-navy underline">
            {AGENT.phone}
          </a>
        </p>
        <p className="text-lg">
          <a href={`mailto:${AGENT.email}`} className="text-navy underline">
            {AGENT.email}
          </a>
        </p>
      </section>
    </div>
  );
}
