import { redirect } from "next/navigation";
import { getProfile, homeFor } from "@/lib/auth";

// "/" just sends each person to their own home page.
export default async function Home() {
  const profile = await getProfile();
  redirect(profile ? homeFor(profile.role) : "/login");
}
