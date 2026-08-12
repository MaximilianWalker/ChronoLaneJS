import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    root: resolve(import.meta.dirname, "site"),
    base: "/ChronoLaneJS/",
    publicDir: resolve(import.meta.dirname, "assets"),
    plugins: [react()],
    build: {
        outDir: resolve(import.meta.dirname, "site-dist"),
        emptyOutDir: true,
        sourcemap: true
    }
});
