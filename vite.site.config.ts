import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
    root: resolve(import.meta.dirname, "site"),
    base: command === "serve" ? "/" : "/ChronoLaneJS/",
    publicDir: resolve(import.meta.dirname, "assets"),
    plugins: [react()],
    build: {
        outDir: resolve(import.meta.dirname, "site-dist"),
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                home: resolve(import.meta.dirname, "site/index.html"),
                docs: resolve(import.meta.dirname, "site/docs/index.html")
            }
        }
    }
}));
