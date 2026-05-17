import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fabric.js는 브라우저 전용 — Vercel 서버 번들에서 제외
  serverExternalPackages: ["fabric"],
};

export default nextConfig;
