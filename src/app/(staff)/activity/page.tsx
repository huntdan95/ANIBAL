import { ActivityList } from "@/components/ActivityList";
import { PageTitle } from "@/components/ui";
import { getT } from "@/i18n/server";
import { listActivity } from "@/lib/activity";
import { requireRole } from "@/lib/auth";

// Danny & Aníbal: the latest 20 things that happened, in plain words.
export default async function ActivityPage() {
  const profile = await requireRole("admin", "referrer");
  const { lang, t } = await getT();
  const items = await listActivity(20);

  return (
    <div className="space-y-4">
      <PageTitle sub={t.feed.intro}>{t.feed.title}</PageTitle>
      <ActivityList items={items} t={t} lang={lang} linkToLead={profile.role === "admin"} />
    </div>
  );
}
