import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
  turbopack: {
    rules: {
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
    resolveAlias: {
      worker_threads: "./lib/stubs/worker_threads.js",
    },
    resolveExtensions: [
      ".md",
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".json",
    ],
  },
};

export default nextConfig;
