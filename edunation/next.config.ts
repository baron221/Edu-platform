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
      {
        // Unsplash Images (both old and new domains)
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
