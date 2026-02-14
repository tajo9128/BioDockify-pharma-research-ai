import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* Standalone output for Docker deployment */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
};

export default nextConfig;

