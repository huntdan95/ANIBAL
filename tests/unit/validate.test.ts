import { describe, expect, it } from "vitest";
import { normalizePhone, validateLead } from "@/lib/leads/validate";

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

const good = {
  full_name: "  Juan   Pérez ",
  phone: "(615) 555-0101",
  email: "Juan@Example.com ",
  street: "100 Main St",
  city: "Nashville",
  state: "tn",
  zip: "37211-1234",
  language: "es",
  source: "anibal",
};

describe("referral form checks", () => {
  it("accepts a normal referral and cleans it up", () => {
    const { input, errors } = validateLead(form(good));
    expect(errors).toEqual({});
    expect(input).toMatchObject({
      full_name: "Juan Pérez",
      phone: "6155550101",
      email: "juan@example.com",
      state: "TN",
      zip: "37211",
      source: "anibal",
      business_name: null,
    });
  });

  it("requires the required fields", () => {
    const { errors } = validateLead(form({}));
    expect(Object.keys(errors).sort()).toEqual(["city", "email", "full_name", "phone", "state", "street", "zip"]);
  });

  it("phone must be 10 digits; a leading 1 is dropped", () => {
    expect(normalizePhone("+1 615-555-0101")).toBe("6155550101");
    expect(validateLead(form({ ...good, phone: "555-0101" })).errors.phone).toBe("phone");
  });

  it("rejects a bad email, ZIP, or state", () => {
    const { errors } = validateLead(form({ ...good, email: "juan@", zip: "372", state: "XX" }));
    expect(errors).toEqual({ email: "email", zip: "zip", state: "state" });
  });

  it("ignores an unknown 'how did you hear' value", () => {
    expect(validateLead(form({ ...good, source: "tiktok" })).input.source).toBeNull();
  });
});
