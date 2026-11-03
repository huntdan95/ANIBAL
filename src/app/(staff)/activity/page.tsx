import { ActivityList } from "@/components/ActivityList";
import { getT } from "@/i18n/server";
import { listActivity } from "@/lib/activity";
import { requireRole } from "@/lib/auth";

// Danny & Aníbal: the latest 20 things that happened, in plain words.
export default async function ActivityPage() {
  const profile = await requireRole("admin", "referrer");
  const { lang, t } = await getT();
  const items = await listActivity(20);

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">{t.feed.title}</h1>
      <p className="mt-1 mb-4 text-slate-600">{t.feed.intro}</p>
      <ActivityList items={items} t={t} lang={lang} linkToLead={profile.role === "admin"} />
    </div>
  );
}
