/// <reference types="vitest/config" />

import { resolve } from "node:path";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite";

/** Keeps React, date-fns, and their subpaths external to the library bundle. */
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
    optimizeDeps: {
        include: [
            "date-fns/constructFrom",
            "storybook/theming"
        ]
    },
    build: {
        lib: {
            entry: resolve(import.meta.dirname, "src/packageEntry.ts"),
            formats: ["es"],
            fileName: "index",
            cssFileName: "chronolanejs"
        },
        rollupOptions: {
            external: isPeerDependency,
            output: {
                banner: '"use client";'
            }
        },
        sourcemap: true
    },
    test: {
        projects: [{
            extends: true,
            plugins: [storybookTest({
                configDir: resolve(import.meta.dirname, ".storybook")
            })],
            test: {
                name: "storybook",
                browser: {
                    api: {
                        port: 62102,
                        strictPort: false
                    },
                    enabled: true,
                    headless: true,
                    provider: playwright({}),
                    instances: [
                        { browser: "chromium" },
                        { browser: "firefox" }
                    ]
                }
            }
        }]
    }
});
