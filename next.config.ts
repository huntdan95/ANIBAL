import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

// Cache Components is left OFF on purpose: almost every page here depends on
// who is signed in, so plain per-request rendering is simpler and safer.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

/**
 * NEXT_PUBLIC_ values are copied into the site when it's built, so the address used in every
 * email link is fixed at build time. Stop the build if it's missing (the app would otherwise
 * link to localhost), or if a Vercel production build would link to localhost. A failed
 * Vercel build leaves the previous version of the site running.
 */
function checkSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set, so email links would point to localhost. " +
        'In Vercel → Settings → Environment Variables, add it as type "Config" with the site\'s address ' +
        "(for example https://your-domain.com, no slash at the end), then redeploy. Locally, set it in .env.local.",
    );
  }
  if (process.env.VERCEL_ENV === "production" && /\/\/(localhost|127\.0\.0\.1)\b/i.test(siteUrl)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is "${siteUrl}" on the live site, so email links would point to localhost. ` +
        "In Vercel, set it to the site's address, then redeploy.",
    );
  }
}

export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) checkSiteUrl();
  return nextConfig;
}
