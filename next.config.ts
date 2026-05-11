import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lxgqxdnxuikemeusegif.supabase.co",
      },
    ],
  },
};

export default nextConfig;