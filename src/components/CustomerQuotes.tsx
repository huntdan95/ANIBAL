import type { Lang, Messages } from "@/i18n/messages";
import { formatDate } from "@/lib/format";
import type { Quote } from "@/lib/quotes";
import { SubmitButton } from "./SubmitButton";
import { buttonClass } from "./ui";

/** The customer's "Mis cotizaciones": each quote's note, the PDF, and "Quiero seguir adelante". */
export function CustomerQuotes({
  quotes,
  t,
  lang,
  proceed,
  canProceed,
}: {
  quotes: Quote[];
  t: Messages;
  lang: Lang;
  proceed: (quoteId: string) => (fd: FormData) => Promise<void>;
  /** false once the policy is active or the lead is closed */
  canProceed: boolean;
}) {
  const q = t.quotes;
  return (
    <ul className="mt-3 space-y-3">
      {quotes.map((quote) => (
        <li key={quote.id} className="rounded-xl border-2 border-gold/50 bg-cream-light/50 p-4">
          <p className="text-lg font-bold text-navy">{quote.note}</p>
          <p className="text-sm text-slate-500">{q.sentOn(formatDate(quote.created_at, lang))}</p>
          <a href={`/q/${quote.id}`} target="_blank" rel="noopener" className={buttonClass("secondary", "mt-3 w-full")}>
            📄 {q.viewPdf}
          </a>
          {quote.proceed_at ? (
            <p className="mt-3 rounded-xl bg-white p-3 font-semibold text-navy">
              ✓ {q.proceedDone(formatDate(quote.proceed_at, lang))}
            </p>
          ) : !canProceed ? null : (
            <form action={proceed(quote.id)} className="mt-2">
              <SubmitButton pendingLabel={t.portal.sending} className="h-14 w-full text-lg">
                {q.proceed} →
              </SubmitButton>
              <p className="mt-2 text-center text-sm text-slate-600">{q.proceedNote}</p>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
