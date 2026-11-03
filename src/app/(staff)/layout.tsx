import { StaffNav } from "@/components/StaffNav";
import { getT } from "@/i18n/server";
import { getProfile } from "@/lib/auth";

// Tabs shared by Danny's and Aníbal's pages. Each page still checks the role itself.
export default async function StaffLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();
  const { t } = await getT();
  const isStaff = profile?.role === "admin" || profile?.role === "referrer";
  const items = [
    { href: "/leads", label: t.nav.leads },
    { href: "/activity", label: t.nav.activity },
    ...(profile?.role === "admin" ? [{ href: "/scorecard", label: t.nav.scorecard }] : []),
  ];
  return (
    <>
      {isStaff && <StaffNav items={items} />}
      {children}
    </>
  );
}
