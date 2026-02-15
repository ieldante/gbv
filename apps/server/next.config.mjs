/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@gbv/config", "@gbv/core"],
};

export default nextConfig;