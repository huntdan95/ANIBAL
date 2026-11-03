"use client";

import { useState } from "react";
import { messages, type Lang } from "@/i18n/messages";
import { buttonClass } from "./ui";

/**
 * Aníbal's referral link with one-tap sharing. People who sign up through it
 * are added as his referrals.
 */
export function ShareLink({ url, lang }: { url: string; lang: Lang }) {
  const t = messages[lang].leads.share;
  const [copied, setCopied] = useState(false);
  const message = t.message(url);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t.copy, url); // older phones: let them copy it by hand
    }
  }

  async function shareOther() {
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        // they closed the share sheet
      }
    } else {
      await copy();
    }
  }

  return (
    <section className="rounded-2xl border-2 border-gold/60 bg-cream-light p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy">
        <span aria-hidden>📲</span> {t.title}
      </h2>
      <p className="mt-1 text-slate-700">{t.body}</p>
      <p className="mt-3 select-all break-all rounded-xl bg-white px-3 py-2.5 text-base font-semibold text-navy">
        {url}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener"
          className={buttonClass("primary", "w-full px-3")}
        >
          <span aria-hidden>💬</span> WhatsApp
        </a>
        <button type="button" onClick={copy} className={buttonClass("secondary", "w-full px-3")} aria-live="polite">
          {copied ? `✓ ${t.copied}` : t.copy}
        </button>
      </div>
      <button
        type="button"
        onClick={shareOther}
        className="mt-2 h-10 w-full text-sm font-semibold text-steel hover:text-navy"
      >
        {t.more}
      </button>
    </section>
  );
}
