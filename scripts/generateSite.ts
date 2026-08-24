import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";

import App from "../site/src/App.js";
import type { DocumentSource } from "../site/src/content.js";
import {
    documentDefinitions,
    normalizeDocumentSource,
    type DocumentDefinition
} from "../site/src/documentManifest.js";
import DocsPage from "../site/src/DocsPage.js";

const repositoryRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(repositoryRoot, "site-dist");
const siteUrl = "https://maximilianwalker.github.io/ChronoLaneJS/";
const siteBaseUrl = "/ChronoLaneJS/";

const injectRoot = (html: string, markup: string): string => {
    const emptyRoot = '<div id="root"></div>';
    if (!html.includes(emptyRoot)) {
        throw new Error("The Vite HTML output does not contain an empty React root.");
    }
    return html.replace(emptyRoot, `<div id="root">${markup}</div>`);
};

const renderPage = (component: React.ReactNode): string => renderToString(
    createElement(StrictMode, null, component)
);

const canonicalUrl = (definition: DocumentDefinition): string => (
    new URL(definition.route, siteUrl).href
);

const applyDocumentMetadata = (
    html: string,
    definition: DocumentDefinition
): string => {
    const replacements = new Map([
        ["__DOCUMENT_TITLE__", definition.title],
        ["__DOCUMENT_DESCRIPTION__", definition.metaDescription],
        ["__DOCUMENT_URL__", canonicalUrl(definition)]
    ]);

    let page = html;
    for (const [token, value] of replacements) page = page.replaceAll(token, value);

    if (/__DOCUMENT_(?:TITLE|DESCRIPTION|URL)__/.test(page)) {
        throw new Error(`Document metadata replacement failed for ${definition.id}.`);
    }
    return page;
};

const loadDocuments = async (): Promise<readonly DocumentSource[]> => Promise.all(
    documentDefinitions.map(async (definition) => {
        const source = await readFile(resolve(repositoryRoot, definition.githubPath), "utf8");
        return {
            ...definition,
            source: normalizeDocumentSource(definition.id, source)
        };
    })
);

const writeDocumentPages = async (
    template: string,
    documents: readonly DocumentSource[]
): Promise<void> => {
    for (const document of documents) {
        const markup = renderPage(createElement(DocsPage, {
            activeId: document.id,
            baseUrl: siteBaseUrl,
            documents
        }));
        const pageTemplate = document.id === "documentation"
            ? template.replace("</head>", `${createLegacyRedirectScript()}\n    </head>`)
            : template;
        const html = injectRoot(applyDocumentMetadata(pageTemplate, document), markup);
        const outputPath = resolve(outputRoot, document.route, "index.html");
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, html);
    }
};

const createLegacyRedirectScript = (): string => {
    const routes = Object.fromEntries(documentDefinitions.map((document) => [
        document.id,
        `${siteBaseUrl}${document.route}`
    ]));
    return [
        "        <script>",
        "            (() => {",
        `                const routes = ${JSON.stringify(routes)};`,
        "                if (!window.location.hash.startsWith(\"#doc-\")) return;",
        "                const [id, anchor] = window.location.hash.slice(5).split(\"/\", 2);",
        "                const route = routes[id] ?? routes.documentation;",
        "                window.location.replace(route + (anchor ? \"#\" + anchor : \"\"));",
        "            })();",
        "        </script>"
    ].join("\n");
};

const writeSitemap = async (): Promise<void> => {
    const urls = [
        siteUrl,
        ...documentDefinitions.map(canonicalUrl)
    ];
    const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map((url) => `    <url><loc>${url}</loc></url>`),
        "</urlset>",
        ""
    ].join("\n");
    await writeFile(resolve(outputRoot, "sitemap.xml"), sitemap);
};

const homeTemplate = await readFile(resolve(outputRoot, "index.html"), "utf8");
const docsTemplate = await readFile(resolve(outputRoot, "docs/index.html"), "utf8");
const homeMarkup = renderPage(createElement(App, { baseUrl: siteBaseUrl }));
const documents = await loadDocuments();

await writeFile(resolve(outputRoot, "index.html"), injectRoot(homeTemplate, homeMarkup));
await writeDocumentPages(docsTemplate, documents);
await writeSitemap();
