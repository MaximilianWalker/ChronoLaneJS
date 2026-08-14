import { useEffect, useState } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import {
    documents,
    isDocumentId,
    type DocumentId
} from "./content.js";

const REPOSITORY_URL = "https://github.com/MaximilianWalker/ChronoLaneJS";
const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw, rehypeSlug];

const getDocumentFromHash = (): DocumentId => {
    const documentId = window.location.hash.replace(/^#doc-/, "");
    return isDocumentId(documentId)
        ? documentId
        : "overview";
};

const getDocumentIdFromHref = (href?: string): DocumentId | null => {
    const filename = href?.replace(/^\.\//, "").toLowerCase();
    if (filename === "readme.md") return "overview";
    if (filename === "development.md") return "development";
    if (filename === "roadmap.md") return "roadmap";
    if (filename === "security.md") return "security";
    return null;
};

const markdownComponents: Components = {
    a: ({ href, children, ...props }) => {
        const documentId = getDocumentIdFromHref(href);
        if (documentId) {
            return (
                <a {...props} href={`#doc-${documentId}`}>
                    {children}
                </a>
            );
        }

        if (href === "./LICENSE" || href === "LICENSE") {
            return (
                <a
                    {...props}
                    href={`${REPOSITORY_URL}/blob/main/LICENSE`}
                    target="_blank"
                    rel="noreferrer"
                >
                    {children}
                </a>
            );
        }

        const external = href?.startsWith("http");
        return (
            <a
                {...props}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
            >
                {children}
            </a>
        );
    }
};

export default function Docs() {
    const [activeId, setActiveId] = useState<DocumentId>(getDocumentFromHash);
    const activeDocument = documents.find(({ id }) => id === activeId) ?? documents[0]!;

    useEffect(() => {
        const syncFromHash = () => {
            setActiveId(getDocumentFromHash());
            if (window.location.hash.startsWith("#doc-")) {
                requestAnimationFrame(() => document.getElementById("document")?.scrollIntoView());
            }
        };
        window.addEventListener("hashchange", syncFromHash);
        syncFromHash();
        return () => window.removeEventListener("hashchange", syncFromHash);
    }, []);

    return (
        <section className="docs-section" aria-label="Repository documentation">
            <div className="docs-shell">
                <aside className="docs-nav" aria-label="Documentation pages">
                    <div className="docs-nav-heading">
                        <span>Library docs</span>
                        <span className="docs-live-dot">Live source</span>
                    </div>
                    {documents.map((document) => (
                        <a
                            key={document.id}
                            className={`docs-nav-link${activeId === document.id ? " is-active" : ""}`}
                            href={`#doc-${document.id}`}
                            aria-current={activeId === document.id ? "page" : undefined}
                        >
                            <strong>{document.label}</strong>
                            <span>{document.description}</span>
                        </a>
                    ))}
                </aside>

                <article className="markdown-document" id="document">
                    <div className="markdown-source-bar">
                        <span>{activeDocument.githubPath}</span>
                        <a
                            href={`${REPOSITORY_URL}/blob/main/${activeDocument.githubPath}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Edit on GitHub <span aria-hidden="true">↗</span>
                        </a>
                    </div>
                    <Markdown
                        remarkPlugins={remarkPlugins}
                        rehypePlugins={rehypePlugins}
                        components={markdownComponents}
                    >
                        {activeDocument.source}
                    </Markdown>
                </article>
            </div>
        </section>
    );
}
