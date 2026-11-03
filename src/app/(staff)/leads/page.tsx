import { LeadsView } from "@/components/LeadsView";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth";
import { asFilter } from "@/lib/leads/filter";
import { env } from "@/lib/env";
import { listVisibleLeads } from "@/lib/leads/queries";
import { ANIBAL_LINK } from "@/lib/signup";

// Danny & Aníbal's home: the lead list.
export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const profile = await requireRole("admin", "referrer");
  const { lang, t } = await getT();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";

  return (
    <LeadsView
      all={await listVisibleLeads()}
      filter={asFilter(sp.f)}
      q={q}
      t={t}
      lang={lang}
      isDanny={profile.role === "admin"}
      justAdded={sp.added === "1"}
      shareUrl={profile.role === "referrer" ? `${env.siteUrl()}/r/${ANIBAL_LINK}` : undefined}
    />
  );
}
