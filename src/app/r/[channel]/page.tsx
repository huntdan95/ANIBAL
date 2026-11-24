import { SignupScreen, signupMetadata } from "@/components/SignupScreen";

export const metadata = signupMetadata;

// Public page for people who heard about IPT: /r/radio, /r/boletin, /r/revista, /r/evento, and /r/anibal
// (Aníbal's old link; the bare domain "/" now shows the same page). Unknown channels are "not found".
export default async function SignupPage({ params }: PageProps<"/r/[channel]">) {
  const { channel } = await params;
  return <SignupScreen channel={channel} />;
}
