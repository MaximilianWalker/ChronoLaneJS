import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";

import type { DocumentId } from "../../site/src/documentManifest.js";
import {
    createDocumentHref,
    findDocumentByPath,
    parseLegacyDocumentLocation
} from "../../site/src/documentRouting.js";
import { markdownRehypePlugins } from "../../site/src/markdown.js";

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
