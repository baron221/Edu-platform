import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === 'development',
  register: true,
});
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
        // Picsum (reliable random course thumbnails)
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  allowedDevOrigins: [
    'sharita-blanketless-commiseratively.ngrok-free.dev',
    'localhost:3000'
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Increased from default but strictly capped for vercel limits
    },
  },
  turbopack: {},
};

export default withPWA(nextConfig);
