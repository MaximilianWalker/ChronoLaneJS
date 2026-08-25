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
import { createPublicUrl, siteMetadata } from "../site/src/siteMetadata.js";

const repositoryRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(repositoryRoot, "site-dist");

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

const canonicalUrl = (definition: DocumentDefinition): string => createPublicUrl(
    definition.route
);

const replaceMetadata = (
    html: string,
    replacements: ReadonlyMap<string, string>,
    pageName: string
): string => {
    let page = html;
    for (const [token, value] of replacements) page = page.replaceAll(token, value);

    if (/__(?:(?:HOME|DOCUMENT)_(?:TITLE|SOCIAL_TITLE|DESCRIPTION|SOCIAL_DESCRIPTION|URL)|CURRENT_RELEASE)__/.test(page)) {
        throw new Error(`Metadata replacement failed for ${pageName}.`);
    }
    return page;
};

const applyDocumentMetadata = (
    html: string,
    definition: DocumentDefinition
): string => {
    const replacements = new Map<string, string>([
        ["__DOCUMENT_TITLE__", definition.title],
        ["__DOCUMENT_DESCRIPTION__", definition.metaDescription],
        ["__DOCUMENT_URL__", canonicalUrl(definition)]
    ]);
    return replaceMetadata(html, replacements, definition.id);
};

const applyHomeMetadata = (html: string): string => replaceMetadata(
    html,
    new Map<string, string>([
        ["__HOME_TITLE__", siteMetadata.title],
        ["__HOME_SOCIAL_TITLE__", siteMetadata.socialTitle],
        ["__HOME_DESCRIPTION__", siteMetadata.description],
        ["__HOME_SOCIAL_DESCRIPTION__", siteMetadata.socialDescription],
        ["__CURRENT_RELEASE__", siteMetadata.currentRelease],
        ["__HOME_URL__", siteMetadata.url]
    ]),
    "homepage"
);

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
            baseUrl: siteMetadata.basePath,
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
        `${siteMetadata.basePath}${document.route}`
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
        siteMetadata.url,
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
const homeMarkup = renderPage(createElement(App, { baseUrl: siteMetadata.basePath }));
const documents = await loadDocuments();

await writeFile(
    resolve(outputRoot, "index.html"),
    injectRoot(applyHomeMetadata(homeTemplate), homeMarkup)
);
await writeDocumentPages(docsTemplate, documents);
await writeSitemap();
