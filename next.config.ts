import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
