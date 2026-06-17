import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright-core", "@browserbasehq/sdk"],
};

export default nextConfig;
