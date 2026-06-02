/** @type {import('next').NextConfig} */
const nextConfig = {
  // See https://lucide.dev/guide/packages/lucide-react#nextjs-example
  transpilePackages: ["lucide-react"],
  // Fix Tailwind v3 + Next.js 15.2 prerender crash (entryCSSFiles)
  experimental: {
    // Disable turbopack to avoid native binary issues on Render
    turbo: {},
  },
  // Disable lint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
