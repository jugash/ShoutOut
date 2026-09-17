import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.resolve(import.meta.dirname);

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Pin the workspace root so a stray lockfile higher up the tree is ignored.
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
