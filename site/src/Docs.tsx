import { useEffect, useMemo, useState } from "react";
import Markdown, { type Components } from "react-markdown";

import {
    documents,
    isDocumentId,
    type DocumentId
} from "./content.js";
import { REPOSITORY_URL } from "./Chrome.js";
import { parseDocumentLocation } from "./documentRouting.js";
import { markdownRehypePlugins, markdownRemarkPlugins } from "./markdown.js";

const getDocumentLocation = () => parseDocumentLocation(window.location.hash, isDocumentId);

const resolveRepositoryPath = (currentPath: string, href: string): string => {
    const currentDirectory = currentPath.includes("/")
        ? currentPath.slice(0, currentPath.lastIndexOf("/") + 1)
        : "";
    return new URL(href, `https://repository.invalid/${currentDirectory}`)
        .pathname
        .replace(/^\//, "");
};

export default function Docs() {
    const [activeId, setActiveId] = useState<DocumentId>(() => (
        getDocumentLocation()?.id ?? "documentation"
    ));
    const activeDocument = documents.find(({ id }) => id === activeId) ?? documents[0]!;
    const markdownComponents = useMemo<Components>(() => ({
        a: ({ href, children, ...props }) => {
            if (!href) return <a {...props}>{children}</a>;
            if (/^[a-z][a-z\d+.-]*:/i.test(href)) {
                const opensNewTab = /^https?:/i.test(href);
                return (
                    <a
                        {...props}
                        href={href}
                        target={opensNewTab ? "_blank" : undefined}
                        rel={opensNewTab ? "noreferrer" : undefined}
                    >
                        {children}
                    </a>
                );
            }

            const [path, anchor] = href.split("#", 2);
            const repositoryPath = path
                ? resolveRepositoryPath(activeDocument.githubPath, path)
                : activeDocument.githubPath;
            const document = documents.find(({ githubPath }) => (
                githubPath.toLowerCase() === repositoryPath.toLowerCase()
            ));
            if (document) {
                return (
                    <a
                        {...props}
                        href={`#doc-${document.id}${anchor ? `/${anchor}` : ""}`}
                    >
                        {children}
                    </a>
                );
            }

            return (
                <a
                    {...props}
                    href={`${REPOSITORY_URL}/${repositoryPath.endsWith("/")
                        ? "tree"
                        : "blob"}/main/${repositoryPath}${anchor ? `#${anchor}` : ""}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    {children}
                </a>
            );
        }
    }), [activeDocument.githubPath]);

    useEffect(() => {
        const syncFromHash = () => {
            const location = getDocumentLocation();
            if (!location) return;

            setActiveId(location.id);
            requestAnimationFrame(() => requestAnimationFrame(() => {
                document.getElementById(location.anchor ?? "document")?.scrollIntoView();
            }));
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
                    {documents.map((document, index) => (
                        <div key={document.id} className="docs-nav-entry">
                            {(index === 0 || documents[index - 1]?.category !== document.category) && (
                                <h2>{document.category}</h2>
                            )}
                            <a
                                className={`docs-nav-link${activeId === document.id ? " is-active" : ""}`}
                                href={`#doc-${document.id}`}
                                aria-current={activeId === document.id ? "page" : undefined}
                            >
                                <strong>{document.label}</strong>
                                <span>{document.description}</span>
                            </a>
                        </div>
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
                        remarkPlugins={markdownRemarkPlugins}
                        rehypePlugins={markdownRehypePlugins}
                        components={markdownComponents}
                    >
                        {activeDocument.source}
                    </Markdown>
                </article>
            </div>
        </section>
    );
}
