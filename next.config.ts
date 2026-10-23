import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["playwright"],
  devIndicators: false,
};

export default config;
