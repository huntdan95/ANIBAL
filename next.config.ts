import type { NextConfig } from "next";

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

export default nextConfig;
