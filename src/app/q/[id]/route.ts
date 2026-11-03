import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { QUOTE_LINK_SECONDS } from "@/lib/quotes";
import { createClient } from "@/lib/supabase/server";

/**
 * /q/<quote id>: opens a quote PDF. Each tap makes a fresh signed link that
 * works for 5 minutes. Only Danny and that quote's customer get one. The
 * database and storage rules decide; Aníbal and everyone else get "not found".
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/q/[id]">) {
  const { id } = await ctx.params;
  if (!(await getProfile())) redirect("/login");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: quote } = await supabase.from("quotes").select("pdf_path").eq("id", id).maybeSingle();
  if (!quote) notFound();

  const { data, error } = await supabase.storage.from("quotes").createSignedUrl(quote.pdf_path, QUOTE_LINK_SECONDS);
  if (error || !data) notFound();
  redirect(data.signedUrl);
}
