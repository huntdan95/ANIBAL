import type { Lang, Messages } from "@/i18n/messages";
import { formatDate } from "@/lib/format";
import type { Quote } from "@/lib/quotes";
import { PostQuoteForm } from "./PostQuoteForm";
import { Notice } from "./ui";

/** Danny's quotes card: what's been posted, who wants to move forward, and the form to post another. */
export function QuotesPanel({
  quotes,
  t,
  lang,
  justPosted,
  emailNote,
  startUpload,
  finish,
}: {
  quotes: Quote[];
  t: Messages;
  lang: Lang;
  justPosted: boolean;
  emailNote: string;
  startUpload: () => Promise<{ path: string; token: string } | { error: string }>;
  finish: (path: string, note: string) => Promise<{ error: string } | void>;
}) {
  const q = t.quotes;
  return (
    <section id="cotizaciones" className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wider text-steel">{q.title}</h2>
      {justPosted && (
        <div className="mt-3">
          <Notice>{q.posted}</Notice>
        </div>
      )}
      {quotes.length === 0 ? (
        <p className="mt-2 text-slate-600">{q.none}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {quotes.map((quote) => (
            <li key={quote.id} className="rounded-xl border border-slate-200 p-3">
              <p className="font-semibold text-slate-900">{quote.note}</p>
              <p className="text-sm text-slate-500">{q.sentOn(formatDate(quote.created_at, lang))}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={`/q/${quote.id}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-9 items-center rounded-full bg-navy/[0.07] px-3 text-sm font-semibold text-navy hover:bg-navy/[0.12]"
                >
                  📄 PDF
                </a>
                {quote.proceed_at && (
                  <span className="inline-flex h-9 items-center rounded-full bg-gold px-3 text-sm font-bold text-navy-dark">
                    🙌 {q.wantsToProceed(formatDate(quote.proceed_at, lang))}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <PostQuoteForm lang={lang} emailNote={emailNote} startUpload={startUpload} finish={finish} />
      </div>
    </section>
  );
}
