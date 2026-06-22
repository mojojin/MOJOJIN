import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 모바일 기기(동일 와이파이) 접속 허용을 위한 설정
  allowedDevOrigins: ['172.168.1.159'],
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
};

import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
} as any);

export default withPWA(nextConfig);
