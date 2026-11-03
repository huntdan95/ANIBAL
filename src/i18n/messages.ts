/**
 * ALL text shown in the app and in emails lives in this one file.
 * Spanish (es) is the default. English (en) must have exactly the same keys;
 * TypeScript will complain if one is missing.
 *
 * Keep it short and plain: Aníbal and most customers read this on a phone,
 * and none of them are insurance people.
 */

const es = {
  app: {
    name: "IPT Referidos",
    agency: "Insurance Professionals of Tennessee",
  },
  lang: {
    switchTo: "English",
    switchToShort: "EN",
  },
  nav: {
    leads: "Referidos",
    activity: "Actividad",
    scorecard: "Resultados",
    myFile: "Mi archivo",
    logout: "Salir",
  },
  login: {
    title: "Entrar",
    intro: "Escriba su correo y le enviaremos un enlace para entrar. No necesita contraseña.",
    emailLabel: "Correo electrónico",
    submit: "Enviarme el enlace",
    sending: "Enviando…",
    sentTitle: "Revise su correo",
    sent: "Si su correo está registrado, le acabamos de enviar un enlace para entrar. Puede tardar un minuto. Revise también la carpeta de correo no deseado.",
    tryAgain: "Usar otro correo",
    invalidEmail: "Escriba un correo válido.",
    expired: "Ese enlace ya venció. Escriba su correo y le enviamos uno nuevo.",
    failed: "No pudimos entrar con ese enlace. Pida uno nuevo aquí.",
    help: "¿Problemas para entrar? Llame a Danny al",
  },
  confirm: {
    title: "Ya casi",
    note: "Toque el botón para terminar de entrar.",
    button: "Entrar",
  },
  common: {
    loading: "Cargando…",
    comingSoon: "Esta sección viene pronto.",
  },
  leads: {
    title: "Referidos",
  },
  portal: {
    title: "Mi archivo",
    hello: (name: string) => `Hola, ${name}`,
    contactTitle: "Su agente",
  },
  email: {
    signature: "Danny Hunt · Insurance Professionals of Tennessee · 615-295-6003 · danny@go-ipt.com",
    login: {
      subject: "Su enlace para entrar a IPT Referidos",
      body: "Toque el botón para entrar. El enlace funciona por 1 hora y una sola vez.",
      button: "Entrar",
      ignore: "Si usted no pidió este enlace, puede ignorar este correo.",
    },
  },
};

export type Messages = typeof es;

const en: Messages = {
  app: {
    name: "IPT Referrals",
    agency: "Insurance Professionals of Tennessee",
  },
  lang: {
    switchTo: "Español",
    switchToShort: "ES",
  },
  nav: {
    leads: "Referrals",
    activity: "Activity",
    scorecard: "Scorecard",
    myFile: "My file",
    logout: "Sign out",
  },
  login: {
    title: "Sign in",
    intro: "Enter your email and we'll send you a link to sign in. No password needed.",
    emailLabel: "Email",
    submit: "Email me the link",
    sending: "Sending…",
    sentTitle: "Check your email",
    sent: "If your email is registered, we just sent you a sign-in link. It can take a minute. Check your spam folder too.",
    tryAgain: "Use a different email",
    invalidEmail: "Enter a valid email.",
    expired: "That link has expired. Enter your email and we'll send a new one.",
    failed: "We couldn't sign you in with that link. Ask for a new one here.",
    help: "Trouble signing in? Call Danny at",
  },
  confirm: {
    title: "Almost there",
    note: "Tap the button to finish signing in.",
    button: "Sign in",
  },
  common: {
    loading: "Loading…",
    comingSoon: "This section is coming soon.",
  },
  leads: {
    title: "Referrals",
  },
  portal: {
    title: "My file",
    hello: (name: string) => `Hi, ${name}`,
    contactTitle: "Your agent",
  },
  email: {
    signature: "Danny Hunt · Insurance Professionals of Tennessee · 615-295-6003 · danny@go-ipt.com",
    login: {
      subject: "Your IPT Referrals sign-in link",
      body: "Tap the button to sign in. The link works for 1 hour, one time.",
      button: "Sign in",
      ignore: "If you didn't ask for this link, you can ignore this email.",
    },
  },
};

export const messages = { es, en } as const;
export type Lang = keyof typeof messages;
export const LANGS: Lang[] = ["es", "en"];
export const DEFAULT_LANG: Lang = "es";

export function isLang(v: unknown): v is Lang {
  return v === "es" || v === "en";
}
