import type { NextConfig } from "next";
import path from "path";

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
