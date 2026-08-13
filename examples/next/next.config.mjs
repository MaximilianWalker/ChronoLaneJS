import { resolve } from "node:path";

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: resolve(import.meta.dirname, "../.."),
  },
};

export default nextConfig;
