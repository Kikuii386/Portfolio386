// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ 1. ปิดการเช็ค Type ตอน Build
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false, // ปิด Source map เพื่อประหยัดเมมโมรี่

  transpilePackages: [
    '@rainbow-me/rainbowkit',
    '@solana/wallet-adapter-react-ui',
    'lucide-react'
  ],

  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
};

module.exports = nextConfig;