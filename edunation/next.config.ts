import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false,
  register: true,
  skipWaiting: true,
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
    ],
  },
  allowedDevOrigins: [
    'sharita-blanketless-commiseratively.ngrok-free.dev',
    'localhost:3000'
  ],
  turbopack: {},
};

export default withPWA(nextConfig);
