/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["bcryptjs"],
  transpilePackages: ["react-square-web-payments-sdk"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.runmysalon.com" },
      { protocol: "https", hostname: "runmysalon.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ]
  },
}

module.exports = nextConfig
