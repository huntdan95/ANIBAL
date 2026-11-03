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
  stage: {
    new: "Nuevo",
    contacted: "Contactado",
    info_sent: "Información enviada",
    quote_sent: "Cotización enviada",
    bound: "Póliza activa",
    not_bought: "No compró",
    not_fit: "No califica",
  },
  source: {
    radio: "Radio",
    newsletter: "Boletín",
    magazine: "Revista",
    anibal: "Presentación de Aníbal",
    event: "Evento",
    other: "Otro",
  },
  leads: {
    title: "Referidos",
    add: "+ Nuevo referido",
    searchLabel: "Buscar por nombre o teléfono",
    search: "Buscar",
    filters: { open: "Abiertos", bound: "Con póliza", closed: "Cerrados", all: "Todos" },
    empty: "Todavía no hay referidos aquí.",
    noMatch: "Nadie coincide con su búsqueda.",
    daysWithoutContact: (n: number) => (n === 1 ? "1 día sin contacto" : `${n} días sin contacto`),
    heardVia: "Se enteró por",
    example: "EJEMPLO",
    added: "Referido guardado. ¡Gracias!",
    saved: "Cambios guardados.",
    back: "← Volver a la lista",
  },
  form: {
    addTitle: "Nuevo referido",
    editTitle: "Editar referido",
    required: "Los campos con * son obligatorios.",
    full_name: "Nombre completo *",
    phone: "Teléfono (10 dígitos) *",
    email: "Correo electrónico *",
    street: "Dirección *",
    city: "Ciudad *",
    state: "Estado *",
    zip: "Código postal (ZIP) *",
    business_name: "Nombre del negocio",
    language: "Idioma preferido",
    needs_notes: "¿Qué necesita?",
    needsHint: "Por ejemplo: seguro para sus trabajadores, su camioneta, su casa…",
    source: "¿Cómo se enteró de IPT?",
    chooseOne: "Escoja uno",
    referredByAnibal: "Referido por Aníbal",
    save: "Guardar",
    saving: "Guardando…",
    cancel: "Cancelar",
    fixErrors: "Revise los campos marcados en rojo.",
    failed: "No se pudo guardar. Intente otra vez.",
    errors: {
      required: "Este campo es obligatorio.",
      phone: "Escriba 10 dígitos, por ejemplo 615 555 0101.",
      email: "Escriba un correo válido.",
      zip: "Escriba 5 dígitos.",
      state: "Escoja un estado.",
      tooLong: "Es demasiado largo.",
    },
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
  stage: {
    new: "New",
    contacted: "Contacted",
    info_sent: "Info sent",
    quote_sent: "Quote sent",
    bound: "Policy bound",
    not_bought: "Didn't buy",
    not_fit: "Not a fit",
  },
  source: {
    radio: "Radio",
    newsletter: "Newsletter",
    magazine: "Magazine",
    anibal: "Aníbal's presentation",
    event: "Event",
    other: "Other",
  },
  leads: {
    title: "Referrals",
    add: "+ New referral",
    searchLabel: "Search by name or phone",
    search: "Search",
    filters: { open: "Open", bound: "Bound", closed: "Closed", all: "All" },
    empty: "No referrals here yet.",
    noMatch: "Nobody matches your search.",
    daysWithoutContact: (n: number) => (n === 1 ? "1 day without contact" : `${n} days without contact`),
    heardVia: "Heard about IPT from",
    example: "EXAMPLE",
    added: "Referral saved. Thank you!",
    saved: "Changes saved.",
    back: "← Back to the list",
  },
  form: {
    addTitle: "New referral",
    editTitle: "Edit referral",
    required: "Fields marked * are required.",
    full_name: "Full name *",
    phone: "Phone (10 digits) *",
    email: "Email *",
    street: "Street address *",
    city: "City *",
    state: "State *",
    zip: "ZIP code *",
    business_name: "Business name",
    language: "Preferred language",
    needs_notes: "What do they need?",
    needsHint: "For example: coverage for workers, a truck, a home…",
    source: "How did they hear about IPT?",
    chooseOne: "Choose one",
    referredByAnibal: "Referred by Aníbal",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    fixErrors: "Check the fields marked in red.",
    failed: "Couldn't save. Please try again.",
    errors: {
      required: "This field is required.",
      phone: "Enter 10 digits, for example 615 555 0101.",
      email: "Enter a valid email.",
      zip: "Enter 5 digits.",
      state: "Choose a state.",
      tooLong: "That's too long.",
    },
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
