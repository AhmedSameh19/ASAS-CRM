import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy every /api/* call through Next.js so cookies are same-origin.
        // In dev: forwards to the local Wrangler dev server.
        // In production: forwards to the deployed Cloudflare Worker.
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/api"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
