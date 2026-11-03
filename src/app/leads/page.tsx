import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth";

// Danny & Aníbal's home. The lead list is built in step 3.
export default async function LeadsPage() {
  await requireRole("admin", "referrer");
  const { t } = await getT();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t.leads.title}</h1>
      <p className="mt-2 text-slate-600">{t.common.comingSoon}</p>
    </div>
  );
}
