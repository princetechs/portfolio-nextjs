import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow TalkingHead CDN imports if needed
  transpilePackages: [],

  // Headers for security
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
