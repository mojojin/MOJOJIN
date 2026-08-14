import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 모바일 기기(동일 와이파이) 접속 허용
  allowedDevOrigins: ["172.168.1.159"],
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
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
};

export default nextConfig;
