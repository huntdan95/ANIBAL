"use client";

import { useRef, useState } from "react";
import { messages, type Lang } from "@/i18n/messages";
import { MAX_QUOTE_BYTES } from "@/lib/quotes";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { controlClass } from "./form";
import { buttonClass } from "./ui";

type ErrorKey = "file" | "tooBig" | "note" | "upload";

/**
 * Danny posts a quote: PDF + short note. The PDF goes straight from the
 * browser to private storage with a one-time link, then the quote is saved.
 */
export function PostQuoteForm({
  lang,
  emailNote,
  startUpload,
  finish,
}: {
  lang: Lang;
  emailNote: string;
  startUpload: () => Promise<{ path: string; token: string } | { error: string }>;
  finish: (path: string, note: string) => Promise<{ error: string } | void>;
}) {
  const t = messages[lang].quotes;
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [busy, setBusy] = useState(false);
  const noteRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const note = noteRef.current?.value.trim() ?? "";
    if (!file || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")))
      return setError("file");
    if (file.size > MAX_QUOTE_BYTES) return setError("tooBig");
    if (!note || note.length > 500) return setError("note");

    setBusy(true);
    try {
      const ticket = await startUpload();
      if ("error" in ticket) throw new Error(ticket.error);
      const { error: upErr } = await createBrowserSupabase()
        .storage.from("quotes")
        .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: "application/pdf" });
      if (upErr) throw upErr;
      const result = await finish(ticket.path, note); // redirects on success
      if (result?.error) setError(result.error === "note" ? "note" : "upload");
    } catch (err) {
      console.error(err);
      setError("upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-cream-light/60 p-3" noValidate>
      <p className="text-base font-bold text-navy">{t.postTitle}</p>

      <label className="block">
        <span className="mb-1.5 block font-semibold text-slate-800">{t.pdfLabel}</span>
        <span
          className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed bg-white px-3 py-2 ${
            error === "file" || error === "tooBig" ? "border-red-400" : "border-slate-300"
          }`}
        >
          <span className="text-2xl" aria-hidden>
            📄
          </span>
          <span className="min-w-0 flex-1 truncate text-base">
            {file ? file.name : <span className="text-slate-500">{t.choosePdf}</span>}
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </span>
        <span className="mt-1 block text-sm text-slate-500">{t.pdfHint}</span>
      </label>

      <label className="block">
        <span className="mb-1.5 block font-semibold text-slate-800">{t.noteLabel}</span>
        <input
          ref={noteRef}
          maxLength={500}
          placeholder={t.notePlaceholder}
          className={`${controlClass} h-12 ${error === "note" ? "border-red-500" : "border-slate-300"}`}
        />
      </label>

      {error && (
        <p role="alert" className="font-semibold text-red-700">
          {t.errors[error]}
        </p>
      )}

      <button type="submit" disabled={busy} className={buttonClass("primary", "w-full")}>
        {busy && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
        )}
        {busy ? t.posting : t.post}
      </button>
      <p className="text-sm text-slate-500">{emailNote}</p>
    </form>
  );
}
