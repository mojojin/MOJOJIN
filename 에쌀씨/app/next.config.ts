import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 모바일 기기(동일 와이파이) 접속 허용
  allowedDevOrigins: ["172.168.1.159"],
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
