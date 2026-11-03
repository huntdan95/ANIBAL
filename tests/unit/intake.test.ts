import { describe, expect, it } from "vitest";
import { validateIntake } from "@/lib/portal/validate";

const form = (fields: Record<string, string | string[]>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) fd.append(k, x);
  return fd;
};

const contact = {
  full_name: "Juan Pérez",
  phone: "615 555 0101",
  street: "100 Main St",
  city: "Nashville",
  state: "TN",
  zip: "37211",
  language: "es",
};

describe("Mi información form", () => {
  it("needs at least one thing to insure", () => {
    expect(validateIntake(form(contact), "juan@example.com").errors.needs).toBe("pickOne");
  });

  it("keeps the login email no matter what the form says", () => {
    const { contact: c, errors } = validateIntake(
      form({ ...contact, email: "hacker@example.com", needs: "home" }),
      "juan@example.com",
    );
    expect(c.email).toBe("juan@example.com");
    expect(errors).toEqual({});
  });

  it("business follow-ups: payroll like '$2,500' becomes 2500", () => {
    const { intake, errors } = validateIntake(
      form({
        ...contact,
        needs: ["business", "workers"],
        work_type: "Framing",
        weekly_payroll: "$2,500",
        weeks_per_year: "50",
      }),
      "juan@example.com",
    );
    expect(errors).toEqual({});
    expect(intake).toMatchObject({
      needs: ["business", "workers"],
      work_type: "Framing",
      weekly_payroll: 2500,
      weeks_per_year: 50,
    });
  });

  it("ignores follow-up answers for boxes that aren't checked", () => {
    const { intake } = validateIntake(
      form({
        ...contact,
        needs: "vehicle",
        vehicle_count: "2",
        driver_count: "3",
        roof_year: "2010",
        weekly_payroll: "900",
      }),
      "juan@example.com",
    );
    expect(intake).toMatchObject({ vehicle_count: 2, driver_count: 3, roof_year: null, weekly_payroll: null });
  });

  it("rejects impossible numbers", () => {
    const { errors } = validateIntake(
      form({ ...contact, needs: ["workers", "home"], weeks_per_year: "60", roof_year: "1850", weekly_payroll: "lots" }),
      "juan@example.com",
      new Date("2026-11-03"),
    );
    expect(errors).toEqual({ weeks_per_year: "weeks", roof_year: "year", weekly_payroll: "number" });
  });

  it("the customer still has to give their full address", () => {
    const { errors } = validateIntake(
      form({ full_name: "Juan Pérez", phone: "6155550101", state: "TN", language: "es", needs: "home" }),
      "juan@example.com",
    );
    expect(errors).toEqual({ street: "required", city: "required", state: "required", zip: "required" });
  });

  it("still checks the contact info (phone, ZIP)", () => {
    const { errors } = validateIntake(form({ ...contact, phone: "555", zip: "", needs: "home" }), "j@example.com");
    expect(errors).toEqual({ phone: "phone", zip: "required" });
  });

  it("has no fields for SSN, license, VIN or date of birth", async () => {
    const src = (await import("node:fs")).readFileSync("src/lib/portal/validate.ts", "utf8");
    const code = src.replace(/\/\/.*$/gm, ""); // the rule is mentioned in a comment, not in code
    expect(code).not.toMatch(/ssn|social|license|licen[cs]ia|vin\b|birth|nacimiento/i);
  });
});
