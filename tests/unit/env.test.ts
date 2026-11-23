import { describe, expect, it } from "vitest";
import { emailFromWarning, resolveSiteUrl } from "@/lib/env";

describe("site address for email links", () => {
  it("uses the setting, without a slash at the end", () => {
    expect(resolveSiteUrl("https://example.com/", "production")).toBe("https://example.com");
    expect(resolveSiteUrl("https://example.com", "production")).toBe("https://example.com");
  });

  it("falls back to localhost only in local dev and tests", () => {
    expect(resolveSiteUrl(undefined, "development")).toBe("http://localhost:3000");
    expect(resolveSiteUrl(undefined, "test")).toBe("http://localhost:3000");
  });

  it("is a clear error on the live site instead of a localhost link", () => {
    expect(() => resolveSiteUrl(undefined, "production")).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => resolveSiteUrl("", "production")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});

describe("EMAIL_FROM warning", () => {
  it("warns on the live site while emails come from Resend's test sender", () => {
    expect(emailFromWarning("Danny Hunt - IPT <onboarding@resend.dev>", "production")).toMatch(/EMAIL_FROM/);
    expect(emailFromWarning("onboarding@RESEND.dev", "production")).toMatch(/EMAIL_FROM/);
  });

  it("is quiet for a real domain", () => {
    expect(emailFromWarning("Danny Hunt - IPT <danny@example.com>", "production")).toBeNull();
  });

  it("is quiet in local dev, where the test sender is expected", () => {
    expect(emailFromWarning("Danny Hunt - IPT <onboarding@resend.dev>", "development")).toBeNull();
  });
});
