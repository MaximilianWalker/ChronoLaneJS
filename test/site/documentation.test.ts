import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";

import {
    documentDefinitions,
    normalizeDocumentSource,
    type DocumentId
} from "../../site/src/documentManifest.js";
import {
    createDocumentHref,
    findDocumentByPath,
    parseLegacyDocumentLocation
} from "../../site/src/documentRouting.js";
import {
    createDocumentOutline,
    markdownRehypePlugins,
    markdownRemarkPlugins
} from "../../site/src/markdown.js";

const documentIds = new Set<DocumentId>([
    "documentation",
    "api",
    "migration-v2",
    "changelog"
]);
const isDocumentId = (value: string): value is DocumentId => (
    documentIds.has(value as DocumentId)
);

test("parses document routes without treating heading anchors as document changes", () => {
    assert.deepEqual(parseLegacyDocumentLocation("#doc-api/errors", isDocumentId), {
        id: "api",
        anchor: "errors"
    });
    assert.deepEqual(parseLegacyDocumentLocation("#doc-unknown", isDocumentId), {
        id: "documentation",
        anchor: undefined
    });
    assert.deepEqual(parseLegacyDocumentLocation("#doc-api/", isDocumentId), {
        id: "api",
        anchor: undefined
    });
    assert.deepEqual(
        parseLegacyDocumentLocation("#doc-migration-v2/event-editing", isDocumentId),
        { id: "migration-v2", anchor: "event-editing" }
    );
    assert.equal(parseLegacyDocumentLocation("#quick-start", isDocumentId), undefined);
});

test("matches crawlable document paths beneath development and production bases", () => {
    assert.equal(findDocumentByPath("/docs/api/", "/")?.id, "api");
    assert.equal(
        findDocumentByPath("/ChronoLaneJS/docs/migrations/v2/", "/ChronoLaneJS/")?.id,
        "migration-v2"
    );
    assert.equal(findDocumentByPath("/ChronoLaneJS/docs/missing/", "/ChronoLaneJS/"), undefined);
});

test("creates canonical document links with optional heading anchors", () => {
    const api = findDocumentByPath("/docs/api/", "/");
    assert.ok(api);
    assert.equal(
        createDocumentHref("/ChronoLaneJS/", api, "calendar-props"),
        "/ChronoLaneJS/docs/api/#calendar-props"
    );
});

test("organizes documentation around reader tasks", () => {
    assert.deepEqual(
        documentDefinitions.map(({ category, label }) => `${category}: ${label}`),
        [
            "Start: Overview",
            "Start: Getting started",
            "Guides: Examples",
            "Guides: Styling and theming",
            "Guides: Accessibility",
            "Reference: API reference",
            "Releases: Upgrade to v2",
            "Releases: Changelog",
            "Project: About ChronoLaneJS",
            "Project: Roadmap",
            "Project: Security"
        ]
    );
    assert.equal(findDocumentByPath("/docs/project/development/", "/"), undefined);
});

test("replaces the repository masthead with a documentation heading", () => {
    assert.equal(
        normalizeDocumentSource(
            "overview",
            "<h1>ChronoLaneJS</h1>\n\n---\n\nProject introduction."
        ),
        "# About ChronoLaneJS\n\nProject introduction."
    );
});

test("builds a matching outline from rendered Markdown headings", () => {
    assert.deepEqual(createDocumentOutline([
        "# Documentation",
        "",
        "## API `Calendar`",
        "",
        "### Props and callbacks",
        "",
        "```md",
        "## Not a heading",
        "```",
        "",
        "## API Calendar"
    ].join("\n")), [
        { id: "api-calendar", label: "API Calendar", level: 2 },
        { id: "props-and-callbacks", label: "Props and callbacks", level: 3 },
        { id: "api-calendar-1", label: "API Calendar", level: 2 }
    ]);
});

test("keeps the documentation shell reader-facing", () => {
    const docsPage = readFileSync(
        new URL("../../site/src/DocsPage.tsx", import.meta.url),
        "utf8"
    );
    const docs = readFileSync(
        new URL("../../site/src/Docs.tsx", import.meta.url),
        "utf8"
    );

    assert.doesNotMatch(docsPage, /<h1|Build on a clear calendar model/);
    assert.match(docs, /View on GitHub/);
    assert.match(docs, /aria-label="Breadcrumb"/);
    assert.match(docs, /aria-label="On this page"/);
    assert.doesNotMatch(docs, /Edit on GitHub|document\.description/);
});

test("sanitizes repository Markdown before adding heading slugs", () => {
    const markup = renderToStaticMarkup(createElement(Markdown, {
        rehypePlugins: markdownRehypePlugins,
        children: [
            "# Safe heading",
            "",
            '<img src="logo.png" onerror="alert(1)">',
            '<script>alert("unsafe")</script>'
        ].join("\n")
    }));

    assert.match(markup, /<h1 id="safe-heading">Safe heading<\/h1>/);
    assert.match(markup, /<img src="logo\.png"\/>/);
    assert.doesNotMatch(markup, /onerror|script|unsafe/);
});

test("highlights fenced code while preserving plain and inline code", () => {
    const markup = renderToStaticMarkup(createElement(Markdown, {
        remarkPlugins: markdownRemarkPlugins,
        rehypePlugins: markdownRehypePlugins,
        children: [
            "Inline `const` stays plain.",
            "",
            "```tsx",
            "const label: string = \"Today\";",
            "```",
            "",
            "```unknown-language",
            "plain value",
            "```"
        ].join("\n")
    }));

    assert.match(markup, /<code>const<\/code>/);
    assert.match(markup, /<code class="hljs language-tsx">/);
    assert.match(markup, /<span class="hljs-keyword">const<\/span>/);
    assert.match(markup, /<span class="hljs-string">&quot;Today&quot;<\/span>/);
    assert.match(markup, /<code class="hljs language-unknown-language">plain value\n<\/code>/);
    assert.doesNotMatch(markup, /language-unknown-language"><span/);
});
