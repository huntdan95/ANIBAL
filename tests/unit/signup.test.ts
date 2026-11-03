import { describe, expect, it } from "vitest";
import { channelSource, validateSignup } from "@/lib/signup";

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};
const good = { full_name: "Rosa Martínez", phone: "(615) 555-0177", email: "Rosa@Example.com", language: "es" };

describe("public sign-up page", () => {
  it("knows the channel links, in Spanish or English", () => {
    expect(channelSource("radio")).toBe("radio");
    expect(channelSource("boletin")).toBe("newsletter");
    expect(channelSource("Revista")).toBe("magazine");
    expect(channelSource("evento")).toBe("event");
    expect(channelSource("event")).toBe("event");
    expect(channelSource("anibal")).toBe("anibal"); // Aníbal's own link
    expect(channelSource("tiktok")).toBeNull();
  });

  it("accepts a normal sign-up and cleans it up", () => {
    const { input, errors, isBot } = validateSignup(form(good));
    expect(errors).toEqual({});
    expect(isBot).toBe(false);
    expect(input).toEqual({
      full_name: "Rosa Martínez",
      phone: "6155550177",
      email: "rosa@example.com",
      language: "es",
    });
  });

  it("requires name, a 10-digit phone and a valid email", () => {
    expect(validateSignup(form({})).errors).toEqual({ full_name: "required", phone: "required", email: "required" });
    expect(validateSignup(form({ ...good, phone: "555", email: "rosa@" })).errors).toEqual({
      phone: "phone",
      email: "email",
    });
  });

  it("refuses links or emails typed into the name (anti-spam)", () => {
    for (const name of ["Win money www.spam.biz", "http://x.co", "rosa@example.com", "Buy now at cheap.com"]) {
      expect(validateSignup(form({ ...good, full_name: name })).errors.full_name).toBe("name");
    }
  });

  it("spots bots that fill in the hidden field", () => {
    expect(validateSignup(form({ ...good, website: "http://spam" })).isBot).toBe(true);
  });
});
