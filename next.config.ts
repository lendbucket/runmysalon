import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
};

export default nextConfig;
