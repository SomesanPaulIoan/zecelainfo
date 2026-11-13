import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Monorepo: există `package-lock.json` și la rădăcină; fără asta Next 15+ inferă greșit
// rădăcina (părintele) și nu mai găsește `app/` din `frontend/` → 404 pe toate rutele.
const nextAppDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: nextAppDir,
  poweredByHeader: false,
  turbopack: {
    root: nextAppDir,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "zecelainfo.ro" },
      { protocol: "https", hostname: "www.zecelainfo.ro" },
    ],
    localPatterns: [
      {
        pathname: "/cursuri-images/**",
        search: "?v=3",
      },
      {
        pathname: "/cursuri-images/**",
        search: "",
      },
      {
        pathname: "/assets/**",
        search: "",
      },
    ],
  },
  async headers() {
    // Imaginile statice din public/ erau servite cu `max-age=0` (revalidare la fiecare vizita).
    // Fara hash in nume, deci cache moderat + stale-while-revalidate, nu `immutable`.
    const staticImageCache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];
    return [
      { source: "/assets/:path*", headers: staticImageCache },
      { source: "/cursuri-images/:path*", headers: staticImageCache },
    ];
  },
  allowedDevOrigins: ["canopener-unlovable-train.ngrok-free.dev"],
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        // EMFILE pe macOS: poll in loc de mii de watch-uri; ignora doar directoare mari.
        poll: 2000,
        aggregateTimeout: 400,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
