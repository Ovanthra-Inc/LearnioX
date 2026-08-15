/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.API_GATEWAY_INTERNAL_URL || "http://api-gateway:8080/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
