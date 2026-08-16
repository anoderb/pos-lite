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
  // Security headers (F5: fix CORS wildcard, F13: add missing headers)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Explicit value overrides Vercel's wildcard CORS default for this public frontend.
          { key: 'Access-Control-Allow-Origin', value: 'https://pos-lite-delta.vercel.app' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co https://huggingface.co; connect-src 'self' https://api.tokiva.biz.id http://localhost:5000 http://127.0.0.1:5000 https://*.supabase.co; font-src 'self' data:; frame-src 'none'; object-src 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
