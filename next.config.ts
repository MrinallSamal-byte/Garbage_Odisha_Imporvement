import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp", "@prisma/client", "prisma"],
};

export default nextConfig;
