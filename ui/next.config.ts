import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* Standalone output for Docker deployment */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
};

export default nextConfig;

