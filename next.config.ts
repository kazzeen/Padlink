import type { NextConfig } from "next";
import path from "path";

const allowUnsafeEval = process.env.CSP_ALLOW_UNSAFE_EVAL === "1" || process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  `script-src 'self'${allowUnsafeEval ? " 'unsafe-eval'" : ""} 'wasm-unsafe-eval' https:`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.privy.io https://privy.io https://*.walletconnect.org https://api.stripe.com wss:",
  "frame-src 'self' https://*.privy.io https://*.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    "thread-stream",
    "pino",
    "pino-worker",
    "pino-file",
    "pino-pretty",
    "@reown/appkit",
    "@reown/appkit-utils",
    "@reown/appkit-controllers",
    "@walletconnect/ethereum-provider",
  ],
  turbopack: {
    resolveAlias: {
      pino: { browser: "pino/browser" },
    },
    rules: {
      "**/*.md": { loaders: ["raw-loader"] },
      "**/*.zip": { loaders: ["raw-loader"] },
      "**/*.yml": { loaders: ["raw-loader"] },
      "**/*.sh": { loaders: ["raw-loader"] },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.md$/,
      use: "raw-loader",
    });

    if (!isServer) {
      config.resolve.alias["worker_threads"] = path.resolve(
        process.cwd(),
        "lib/stubs/worker_threads.js"
      );
    }

    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "accelerometer=(), camera=(), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
