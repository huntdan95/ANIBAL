import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SignupForm } from "@/components/SignupForm";
import { getT } from "@/i18n/server";
import { AGENT } from "@/lib/agent";
import { channelSource } from "@/lib/signup";
import { signUp } from "./actions";

export const metadata: Metadata = { title: "IPT · ¿Necesita seguro?" };

// Public page for people who heard about IPT: /r/radio, /r/boletin, /r/revista, /r/evento
export default async function SignupPage({ params }: PageProps<"/r/[channel]">) {
  const { channel } = await params;
  const source = channelSource(channel);
  if (!source) notFound();
  const { lang, t } = await getT();
  const s = t.signup;

  return (
    <div className="mx-auto max-w-md space-y-5">
      <Image src="/ipt-logo.png" alt={t.app.agency} width={768} height={417} priority className="mx-auto h-auto w-48" />
      <div className="text-center">
        {s.thanks[source] && <p className="font-semibold text-steel">{s.thanks[source]}</p>}
        <h1 className="mt-1 font-serif text-4xl text-navy">{s.heading}</h1>
        <p className="mt-2 text-lg text-slate-700">{s.intro}</p>
      </div>
      <ul className="flex flex-wrap justify-center gap-2">
        {s.perks.map((p) => (
          <li key={p} className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-navy-dark">
            ✓ {p}
          </li>
        ))}
      </ul>
      <SignupForm lang={lang} action={signUp.bind(null, channel)} />
      <p className="text-center text-base text-slate-600">
        {s.preferCall}{" "}
        <a href={AGENT.phoneHref} className="whitespace-nowrap font-bold text-navy underline">
          {AGENT.phone}
        </a>
      </p>
    </div>
  );
}
