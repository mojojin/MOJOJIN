import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 모바일 기기(동일 와이파이) 접속 허용
  allowedDevOrigins: ["172.168.1.159"],
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  // 성능 최적화
  compress: true,
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['xlsx', 'tesseract.js', '@supabase/supabase-js'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
  // 정적 에셋 장기 캐시 (이미지, 폰트, JS/CSS)
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|ico|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
