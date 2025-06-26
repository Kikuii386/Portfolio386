/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: ['*'], // หรือระบุ IP เฉพาะ เช่น 'http://169.254.43.6:3000'
  },
}

module.exports = nextConfig