import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Producción usa `next start`. No hace falta una imagen standalone.
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Nextjs-Cache", value: "" },
          { key: "X-Nextjs-Prerender", value: "" },
          { key: "X-Nextjs-Stale-Time", value: "" },
        ],
      },
    ];
  },
};

export default nextConfig;