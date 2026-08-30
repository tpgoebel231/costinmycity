import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: "/costinmycity",
  assetPrefix: "/costinmycity",
};

export default nextConfig;
