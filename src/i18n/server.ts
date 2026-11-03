import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, isLang, messages, type Lang } from "./messages";

export const LANG_COOKIE = "lang";

/** The language the current visitor picked with the ES/EN toggle (Spanish by default). */
export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: messages[lang] };
}

export async function setLangCookie(lang: Lang) {
  (await cookies()).set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
