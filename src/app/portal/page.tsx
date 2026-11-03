import { PortalView } from "@/components/PortalView";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth";
import { getMyFile } from "@/lib/portal/queries";
import { submitIntake } from "./actions";

// The customer's own file. ("Mis cotizaciones" fills in at step 7.)
export default async function PortalPage({ searchParams }: PageProps<"/portal">) {
  const profile = await requireRole("customer");
  const { lang, t } = await getT();
  const { sent } = await searchParams;
  const { lead, intake } = await getMyFile(profile.id);

  return (
    <PortalView lead={lead} intake={intake} t={t} lang={lang} justSent={sent === "1"} submitIntake={submitIntake} />
  );
}
