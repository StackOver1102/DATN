import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "r2-image-server.ngoctoanmtc.workers.dev",
      },
      {
        protocol: "https",
        hostname: "zalomini.inhoanglinh.click",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
