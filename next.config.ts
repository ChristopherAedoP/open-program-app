import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimización de performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@assistant-ui/react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-scroll-area',
      'lucide-react'
    ],
  },

  // Compresión
  compress: true,

  // Optimización de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers SEO y seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Seguridad
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Performance y SEO
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Headers específicos para páginas HTML
        source: '/((?!_next|favicon.ico|sitemap.xml|robots.txt).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
      {
        // Headers para archivos estáticos
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects SEO-friendly
  async redirects() {
    return [
      // Ejemplo: redirección de URLs antiguas si fuera necesario
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ];
  },

  // Rewrites para URLs amigables
  async rewrites() {
    return [
      // Mantener URLs limpias para el sitemap
    ];
  },
};

export default nextConfig;
