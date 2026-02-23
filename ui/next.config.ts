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
  // Proxy API requests to backend in development
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8234";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

