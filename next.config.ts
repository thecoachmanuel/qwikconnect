import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/seller-profile/:username',
        destination: '/about-seller/:username',
      },
    ];
  },
};

export default nextConfig;
