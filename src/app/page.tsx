import { redirect } from "next/navigation";
import { SignupScreen, signupMetadata } from "@/components/SignupScreen";
import { getProfile, homeFor } from "@/lib/auth";
import { ROOT_SIGNUP_CHANNEL } from "@/lib/signup";

export const metadata = signupMetadata;

// The bare domain (referidos.us) is the link Aníbal shares.
// Signed in: go to your own home page. Not signed in: Aníbal's public sign-up page, exactly as at
// /r/anibal (same page, same action: the lead is credited to Aníbal and the same emails go out).
// The sign-in page is /login, linked from the bottom of the sign-up page.
export default async function Home() {
  const profile = await getProfile();
  if (profile) redirect(homeFor(profile.role));
  return <SignupScreen channel={ROOT_SIGNUP_CHANNEL} />;
}
