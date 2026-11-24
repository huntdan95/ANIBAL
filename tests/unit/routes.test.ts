/**
 * Where people land. The bare domain (referidos.us) is Aníbal's public sign-up page for anyone
 * who isn't signed in; signed-in people go to their own home; every failed or expired sign-in
 * still goes to /login. The page code runs for real; sign-in, screens and data are stand-ins.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const profile = vi.hoisted(() => ({ current: null as null | { id: string; role: string } }));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT ${to}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/lib/auth", () => ({
  getProfile: async () => profile.current,
  requireRole: async () => profile.current,
  homeFor: (role: string) => (role === "customer" ? "/portal" : "/leads"),
}));
vi.mock("@/components/SignupScreen", () => ({
  SignupScreen: function SignupScreen() {
    return null;
  },
  signupMetadata: { title: "IPT · ¿Necesita seguro?" },
}));
vi.mock("@/components/LeadsView", () => ({
  LeadsView: function LeadsView() {
    return null;
  },
}));
vi.mock("@/i18n/server", () => ({ getT: async () => ({ lang: "es", t: {} }) }));
vi.mock("@/lib/leads/queries", () => ({ listVisibleLeads: async () => [] }));

const { default: Home } = await import("@/app/page");
const { default: SignupPage } = await import("@/app/r/[channel]/page");
const { default: LeadsPage } = await import("@/app/(staff)/leads/page");
const { channelSource } = await import("@/lib/signup");

beforeEach(() => {
  profile.current = null;
});

describe("the bare domain (referidos.us)", () => {
  it("shows Aníbal's sign-up page to anyone not signed in, credited to Aníbal", async () => {
    const el = (await Home()) as ReactElement<{ channel: string }>;
    expect((el.type as { name: string }).name).toBe("SignupScreen");
    expect(el.props.channel).toBe("anibal");
    expect(channelSource(el.props.channel)).toBe("anibal");
  });

  it("sends signed-in people to their own home page", async () => {
    for (const [role, home] of [
      ["admin", "/leads"],
      ["referrer", "/leads"],
      ["customer", "/portal"],
    ]) {
      profile.current = { id: "x", role };
      await expect(Home()).rejects.toThrow(`REDIRECT ${home}`);
    }
  });
});

describe("/r/<channel> (old links keep working)", () => {
  it("/r/anibal shows the same page as the bare domain", async () => {
    const el = (await SignupPage({
      params: Promise.resolve({ channel: "anibal" }),
      searchParams: Promise.resolve({}),
    } as never)) as ReactElement<{ channel: string }>;
    expect((el.type as { name: string }).name).toBe("SignupScreen");
    expect(el.props.channel).toBe("anibal");
  });
});

describe("Aníbal's share buttons", () => {
  it("share the bare domain, not /r/anibal", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://referidos.us/");
    profile.current = { id: "a", role: "referrer" };
    const el = (await LeadsPage({ searchParams: Promise.resolve({}) } as never)) as ReactElement<{ shareUrl?: string }>;
    expect(el.props.shareUrl).toBe("https://referidos.us");
    vi.unstubAllEnvs();
  });

  it("Danny's list has no share card", async () => {
    profile.current = { id: "d", role: "admin" };
    const el = (await LeadsPage({ searchParams: Promise.resolve({}) } as never)) as ReactElement<{ shareUrl?: string }>;
    expect(el.props.shareUrl).toBeUndefined();
  });
});

describe("failed and expired sign-ins still land on /login", () => {
  const src = (p: string) => readFileSync(path.resolve(__dirname, "../../src", p), "utf8");

  it("expired or unknown customer links → /login with the 'expired' message", () => {
    expect(src("app/i/[token]/route.ts")).toContain('redirect("/login?error=expired")');
  });

  it("failed sign-in links → /login with the 'failed' message", () => {
    expect(src("app/i/[token]/route.ts")).toContain('redirect("/login?error=failed")');
    expect(src("app/auth/confirm/page.tsx")).toContain('redirect("/login?error=failed")');
    expect(src("app/auth/confirm/actions.ts")).toContain('redirect("/login?error=failed")');
  });

  it("pages that need a sign-in, and signing out → /login", () => {
    expect(src("lib/auth.ts")).toContain('redirect("/login")');
    expect(src("app/actions.ts")).toContain('redirect("/login")');
  });

  it("the sign-up page links to /login for people who already have an account", () => {
    expect(src("components/SignupScreen.tsx")).toContain('href="/login"');
  });
});
