import { describe, expect, it } from "vitest";
import { messages, type Lang } from "@/i18n/messages";
import { planPings, stageChangeEvent, type PingEvent, type TemplateKey } from "@/lib/notify/plan";
import { firstName, renderPing } from "@/lib/notify/render";

const who = (event: PingEvent, referred: boolean, addedBy?: "admin" | "referrer" | null, viaAnibalLink?: boolean) =>
  planPings(event, { referred, addedBy, viaAnibalLink }).map((p) => `${p.to}:${p.template}`);

const vars = { name: "Juan Pérez", first: "Juan", phone: "(615) 555-0101", place: "Nashville, TN" };

describe("who gets which ping", () => {
  it("Aníbal adds a referral → Danny gets a ping, the customer gets the welcome", () => {
    expect(who("lead_added", true, "referrer")).toEqual(["customer:welcome", "danny:newReferral"]);
  });

  it("Danny adds a lead (every lead is Aníbal's) → customer welcome + Aníbal hears about it", () => {
    expect(who("lead_added", true, "admin")).toEqual(["customer:welcome", "anibal:addedByDanny"]);
    expect(who("lead_added", false, "admin")).toEqual(["customer:welcome"]);
  });

  it("radio / newsletter / magazine sign-up → customer welcome + Danny + Aníbal (it's his lead too)", () => {
    expect(who("lead_added", true, null)).toEqual(["customer:welcome", "danny:newSignup", "anibal:signupChannel"]);
    // only if Aníbal's account is missing does he get nothing
    expect(who("lead_added", false, null)).toEqual(["customer:welcome", "danny:newSignup"]);
  });

  it("sign-up through Aníbal's own link → customer welcome + Danny + Aníbal, with 'your link' wording", () => {
    expect(who("lead_added", true, null, true)).toEqual([
      "customer:welcome",
      "danny:newSignupAnibal",
      "anibal:signupViaLink",
    ]);
  });

  it("sign-up where they already said what they need → 'we got your request' email instead of 'send your info'", () => {
    expect(
      planPings("lead_added", { referred: true, addedBy: null, withInfo: true, viaAnibalLink: true }).map(
        (p) => `${p.to}:${p.template}`,
      ),
    ).toEqual(["customer:welcomeInfoSent", "danny:newSignupAnibal", "anibal:signupViaLink"]);
  });

  it("Danny marks Contacted → Aníbal", () => {
    expect(who("contacted", true)).toEqual(["anibal:contacted"]);
    expect(who("contacted", false)).toEqual([]);
  });

  it("customer submits info → Danny and Aníbal", () => {
    expect(who("info_sent", true)).toEqual(["danny:infoSentDanny", "anibal:infoSentAnibal"]);
    expect(who("info_sent", false)).toEqual(["danny:infoSentDanny"]);
  });

  it("Danny posts a quote → customer and Aníbal", () => {
    expect(who("quote_posted", true)).toEqual(["customer:quoteReady", "anibal:quoteSent"]);
  });

  it("'Quiero seguir adelante' → Danny only (Aníbal sees it in the feed)", () => {
    expect(who("proceed", true)).toEqual(["danny:proceed"]);
  });

  it("Danny marks Bound → customer thank-you and Aníbal", () => {
    expect(who("bound", true)).toEqual(["customer:boundCustomer", "anibal:boundAnibal"]);
  });

  it("closed (No compró / No califica) → Aníbal only, never the customer", () => {
    expect(who("not_bought", true)).toEqual(["anibal:notBought"]);
    expect(who("not_fit", true)).toEqual(["anibal:notFit"]);
    expect(who("not_bought", false)).toEqual([]);
  });

  it("Danny is never pinged about his own actions", () => {
    for (const e of ["contacted", "quote_posted", "bound", "not_bought", "not_fit"] as PingEvent[]) {
      expect(who(e, true).some((x) => x.startsWith("danny"))).toBe(false);
    }
  });
});

describe("stage dropdown → ping", () => {
  it("only real changes to Contacted / Bound / closed send pings", () => {
    expect(stageChangeEvent("new", "contacted")).toBe("contacted");
    expect(stageChangeEvent("quote_sent", "bound")).toBe("bound");
    expect(stageChangeEvent("contacted", "not_fit")).toBe("not_fit");
    expect(stageChangeEvent("contacted", "contacted")).toBeNull();
    expect(stageChangeEvent("new", "quote_sent")).toBeNull(); // real quote posting pings instead
    expect(stageChangeEvent("not_bought", "new")).toBeNull();
  });
});

describe("the messages", () => {
  const render = (template: TemplateKey, lang: Lang, to: "danny" | "anibal" | "customer" = "customer") =>
    renderPing({ to, template, button: "sendInfo" }, lang, vars, "https://app.example/i/TOKEN");

  it("use the exact wording from the spec (Spanish)", () => {
    expect(render("welcome", "es").text).toContain(
      "Danny Hunt de IPT le ayudará con su seguro. Toque aquí para enviar su información.",
    );
    expect(render("quoteReady", "es").subject).toBe("Su cotización está lista");
    expect(render("quoteSent", "es", "anibal").subject).toBe("Danny le envió la cotización a Juan Pérez");
    expect(render("infoSentAnibal", "es", "anibal").subject).toBe("Juan Pérez envió su información");
    expect(render("boundAnibal", "es", "anibal").subject).toBe("Juan Pérez ya tiene su póliza");
  });

  it("tell Aníbal which page a sign-up came from", () => {
    const m = renderPing(
      { to: "anibal", template: "signupChannel", button: "myReferrals" },
      "es",
      {
        ...vars,
        channel: "Radio",
      },
      "https://x",
    );
    expect(m.subject).toBe("Juan Pérez se inscribió (Radio)");
  });

  it("come out in the recipient's language", () => {
    expect(render("welcome", "en").subject).toBe("Danny Hunt from IPT will help you with your insurance");
    expect(render("welcome", "es").subject).toBe("Danny Hunt de IPT le ayudará con su seguro");
  });

  it("customer emails carry their link and say it works for 30 days", () => {
    const m = render("quoteReady", "es");
    expect(m.text).toContain("https://app.example/i/TOKEN");
    expect(m.html).toContain('href="https://app.example/i/TOKEN"');
    expect(m.text).toContain("30 días");
  });

  it("never mention dollar amounts, in any template or language", () => {
    for (const lang of ["es", "en"] as Lang[]) {
      for (const key of Object.keys(messages[lang].ping.templates) as TemplateKey[]) {
        const m = render(key, lang, "anibal");
        expect(m.text).not.toMatch(/\$\s?\d/);
        expect(m.text.length).toBeLessThan(600); // short and plain
      }
    }
  });

  it("names are escaped in the HTML version", () => {
    const m = renderPing(
      { to: "danny", template: "newReferral", button: "viewLead" },
      "es",
      { ...vars, name: "<b>Juan</b>" },
      "https://x",
    );
    expect(m.html).toContain("&lt;b&gt;Juan&lt;/b&gt;");
    expect(m.html).not.toContain("<b>Juan</b>");
  });

  it("greets example leads by their real first name", () => {
    expect(firstName("EJEMPLO – Juan Pérez")).toBe("Juan");
    expect(firstName("María José López")).toBe("María");
  });
});
