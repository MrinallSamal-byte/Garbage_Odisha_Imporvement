import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "@prisma/client", "prisma"],
  experimental: {},
};

export default nextConfig;
