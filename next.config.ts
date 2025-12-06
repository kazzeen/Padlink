import type { NextConfig } from "next";
import path from "path";

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
};

export default nextConfig;
