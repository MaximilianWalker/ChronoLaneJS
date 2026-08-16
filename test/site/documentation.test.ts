import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";

import type { DocumentId } from "../../site/src/content.js";
import { parseDocumentLocation } from "../../site/src/documentRouting.js";
import { markdownRehypePlugins } from "../../site/src/markdown.js";

const documentIds = new Set<DocumentId>(["documentation", "api"]);
const isDocumentId = (value: string): value is DocumentId => (
    documentIds.has(value as DocumentId)
);

test("parses document routes without treating heading anchors as document changes", () => {
    assert.deepEqual(parseDocumentLocation("#doc-api/errors", isDocumentId), {
        id: "api",
        anchor: "errors"
    });
    assert.deepEqual(parseDocumentLocation("#doc-unknown", isDocumentId), {
        id: "documentation",
        anchor: undefined
    });
    assert.deepEqual(parseDocumentLocation("#doc-api/", isDocumentId), {
        id: "api",
        anchor: undefined
    });
    assert.equal(parseDocumentLocation("#quick-start", isDocumentId), undefined);
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
