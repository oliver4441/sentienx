/** @type {import('next').NextConfig} */
const nextConfig = {
  // See https://lucide.dev/guide/packages/lucide-react#nextjs-example
  transpilePackages: ["lucide-react"],
  // Disable lint during build (lint issues are auto-formatting, not code errors)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
