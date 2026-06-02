/** @type {import('next').NextConfig} */
const nextConfig = {
  // See https://lucide.dev/guide/packages/lucide-react#nextjs-example
  transpilePackages: ["lucide-react"],
  // Fix Tailwind v3 + Next.js 15.2 prerender crash (entryCSSFiles)
  experimental: {
    // Use webpack fallback instead of turbopack (native binary issues)
    turbo: {},
  },
  // Disable lint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
