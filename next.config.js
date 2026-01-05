// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
