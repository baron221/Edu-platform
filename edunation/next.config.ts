import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Google profile images
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        // GitHub avatars
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
};

export default nextConfig;
