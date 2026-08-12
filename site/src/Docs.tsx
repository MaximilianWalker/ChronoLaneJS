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
    const [, section, documentId] = window.location.hash.split("/");
    return section === "docs" && documentId && isDocumentId(documentId)
        ? documentId
        : "overview";
};

const getDocumentIdFromHref = (href?: string): DocumentId | null => {
    const filename = href?.replace(/^\.\//, "").toLowerCase();
    if (filename === "readme.md") return "overview";
    if (filename === "contributing.md") return "contributing";
    if (filename === "roadmap.md") return "roadmap";
    if (filename === "security.md") return "security";
    return null;
};

const markdownComponents: Components = {
    a: ({ href, children, ...props }) => {
        const documentId = getDocumentIdFromHref(href);
        if (documentId) {
            return (
                <a {...props} href={`#docs/${documentId}`}>
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
            if (window.location.hash.startsWith("#docs/")) {
                requestAnimationFrame(() => document.getElementById("docs")?.scrollIntoView());
            }
        };
        window.addEventListener("hashchange", syncFromHash);
        syncFromHash();
        return () => window.removeEventListener("hashchange", syncFromHash);
    }, []);

    return (
        <section className="docs-section section" id="docs" aria-labelledby="docs-title">
            <div className="section-heading section-heading--split">
                <div>
                    <p className="eyebrow">Documentation</p>
                    <h2 id="docs-title">Written once. Useful everywhere.</h2>
                </div>
                <p>
                    Every page below is rendered directly from the repository's
                    Markdown. GitHub and this site always tell the same story.
                </p>
            </div>

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
                            href={`#docs/${document.id}`}
                            aria-current={activeId === document.id ? "page" : undefined}
                        >
                            <strong>{document.label}</strong>
                            <span>{document.description}</span>
                        </a>
                    ))}
                </aside>

                <article className="markdown-document">
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
