import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    // Determine the backend URL dynamically at build/runtime.
    // If NEXT_PUBLIC_API_URL is available, use it (strip trailing slash if necessary).
    // Otherwise fallback to http://localhost:5000/api
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, "");

    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/:path*` // Proxy to Backend
      }
    ];
  }
};

export default nextConfig;
