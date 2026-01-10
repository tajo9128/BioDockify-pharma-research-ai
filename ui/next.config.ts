import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  typescript: {
    ignoreBuildErrors: false, // Enable type checking
  },
  reactStrictMode: true,       // Better for React 19
  eslint: {
    ignoreDuringBuilds: false, // Enable linting
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Add this for Tauri compatibility
  distDir: 'out',
};

export default nextConfig;
