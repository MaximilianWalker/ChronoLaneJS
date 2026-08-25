import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { siteMetadata } from "./site/src/siteMetadata.js";

const docsRouteFallback = () => ({
    name: "chronolane-docs-route-fallback",
    configureServer: (server: { middlewares: { use: (middleware: (
        request: { url?: string },
        response: unknown,
        next: () => void
    ) => void) => void } }) => {
        server.middlewares.use((request, _response, next) => {
            const url = new URL(request.url ?? "/", "http://chronolane.local");
            const isDocumentRoute = url.pathname.startsWith("/docs/")
                && !url.pathname.slice("/docs/".length).includes(".");
            if (isDocumentRoute && url.pathname !== "/docs/") {
                request.url = `/docs/index.html${url.search}`;
            }
            next();
        });
    }
});

const staticDocsBuild = (enabled: boolean) => ({
    name: "chronolane-static-docs-build",
    transformIndexHtml: {
        order: "pre" as const,
        handler: (html: string, context: { path: string }) => (
            enabled && context.path.endsWith("/docs/index.html")
                ? html.replace(/\s*<script type="module" src="\/src\/docs-main\.tsx"><\/script>/, "")
                : html
        )
    }
});

export default defineConfig(({ command, isPreview }) => ({
    root: resolve(import.meta.dirname, "site"),
    base: command === "serve" && !isPreview ? "/" : siteMetadata.basePath,
    publicDir: resolve(import.meta.dirname, "assets"),
    plugins: [docsRouteFallback(), staticDocsBuild(command === "build"), react()],
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
