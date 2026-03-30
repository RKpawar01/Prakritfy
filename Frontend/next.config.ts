import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // ✅ Required for Cloud Run
  output: "standalone",

  // Optional (keep if you want)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
