// Builds a short, plain email: a few lines, an optional big button, a signature.
// Produces both a plain-text and a simple HTML version.

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderEmail(opts: {
  lines: string[];
  button?: { label: string; url: string };
  footer?: string[];
  signature: string;
}) {
  const text = [
    ...opts.lines,
    ...(opts.button ? ["", `${opts.button.label}: ${opts.button.url}`] : []),
    ...(opts.footer?.length ? ["", ...opts.footer] : []),
    "",
    "—",
    opts.signature,
  ].join("\n");

  const p = (s: string) => `<p style="margin:0 0 14px;font-size:17px;line-height:1.45">${escape(s)}</p>`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px 16px;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:24px">
${opts.lines.map(p).join("\n")}
${
  opts.button
    ? `<p style="margin:22px 0"><a href="${escape(opts.button.url)}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-size:18px;font-weight:bold;padding:14px 26px;border-radius:10px">${escape(opts.button.label)}</a></p>`
    : ""
}
${(opts.footer ?? []).map((s) => `<p style="margin:0 0 10px;font-size:14px;color:#6b7280">${escape(s)}</p>`).join("\n")}
<p style="margin:20px 0 0;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px">${escape(opts.signature)}</p>
</div></body></html>`;

  return { text, html };
}
