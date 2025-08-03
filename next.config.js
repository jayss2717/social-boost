/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: false,
  },
  images: {
    domains: ['cdn.shopify.com', 'images.unsplash.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { 
            key: 'Content-Security-Policy', 
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.shopify.com https://admin.shopify.com https://*.shopify.com https://*.shopifycloud.com https://unpkg.com https://monorail-edge.shopifysvc.com https://shopify.com https://*.vercel.app",
              "style-src 'self' 'unsafe-inline' https://cdn.shopify.com https://fonts.googleapis.com https://unpkg.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https: https://fonts.gstatic.com https://cdn.shopify.com",
              "connect-src 'self' https: https://*.shopify.com https://*.shopifycloud.com https://monorail-edge.shopifysvc.com https://api.shopify.com https://*.vercel.app",
              "frame-ancestors 'self' https://*.myshopify.com https://admin.shopify.com https://*.shopify.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 