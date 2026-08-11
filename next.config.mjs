/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  compiler: {
    // Remove console.log di production (keep error/warn)
    removeConsole: { exclude: ['error', 'warn'] },
  },
};

export default nextConfig;
