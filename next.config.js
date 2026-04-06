/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["bcryptjs"],
  transpilePackages: ["react-square-web-payments-sdk"],
}

module.exports = nextConfig
