import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "web-platforms.sfo2.cdn.digitaloceanspaces.com",
      },
    ],
  },
};

export default nextConfig;
