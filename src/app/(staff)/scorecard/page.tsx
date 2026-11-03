import { ScorecardView } from "@/components/ScorecardView";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth";
import { listVisibleLeads } from "@/lib/leads/queries";
import { buildScorecard } from "@/lib/scorecard";

// Danny-only scorecard. (Aníbal is sent back to his list.)
export default async function ScorecardPage() {
  await requireRole("admin");
  const { t } = await getT();
  const score = buildScorecard(await listVisibleLeads());
  return <ScorecardView score={score} t={t} />;
}
