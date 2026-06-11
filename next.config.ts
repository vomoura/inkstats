import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cards.lorcast.io",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/spicerack_media/**",
      },
    ],
  },
};

export default nextConfig;
