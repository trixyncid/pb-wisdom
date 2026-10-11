import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server (.next/standalone) for the Docker image.
  output: "standalone",
  // Set per build (git SHA). After a deploy, open tabs do a full reload
  // instead of calling Server Actions / assets from the previous build.
  deploymentId: process.env.DEPLOYMENT_ID || undefined,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.0.241"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
