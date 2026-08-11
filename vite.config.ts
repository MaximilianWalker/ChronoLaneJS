import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const isPeerDependency = (id: string): boolean => (
    id === "react"
    || id === "react-dom"
    || id.startsWith("react/")
    || id.startsWith("react-dom/")
    || id === "date-fns"
    || id.startsWith("date-fns/")
    || id === "@date-fns/tz"
    || id.startsWith("@date-fns/tz/")
);

export default defineConfig({
    plugins: [react()],
    build: {
        lib: {
            entry: resolve(import.meta.dirname, "src/packageEntry.ts"),
            formats: ["es"],
            fileName: "index",
            cssFileName: "chronolane"
        },
        rollupOptions: {
            external: isPeerDependency,
            output: {
                banner: '"use client";'
            }
        },
        sourcemap: true
    }
});
