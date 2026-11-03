import { PortalView } from "@/components/PortalView";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth";
import { getMyFile } from "@/lib/portal/queries";
import { submitIntake, wantToProceed } from "./actions";

// The customer's own file: progress, quotes, "Mi información", Danny's contact.
export default async function PortalPage({ searchParams }: PageProps<"/portal">) {
  const profile = await requireRole("customer");
  const { lang, t } = await getT();
  const { sent, proceed } = await searchParams;
  const { lead, intake, quotes } = await getMyFile(profile.id);

  return (
    <PortalView
      lead={lead}
      intake={intake}
      quotes={quotes}
      t={t}
      lang={lang}
      justSent={sent === "1"}
      justProceeded={proceed === "1"}
      submitIntake={submitIntake}
      proceed={(quoteId) => wantToProceed.bind(null, quoteId)}
    />
  );
}
