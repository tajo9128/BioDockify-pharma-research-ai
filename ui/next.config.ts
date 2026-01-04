import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  /* Static export for Tauri desktop app */
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
  trailingSlash: true,
};

export default nextConfig;

