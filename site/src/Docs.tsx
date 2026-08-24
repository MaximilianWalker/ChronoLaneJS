import { useMemo } from "react";
import Markdown, { type Components } from "react-markdown";

import type { DocumentSource } from "./content.js";
import type { DocumentCategory, DocumentId } from "./documentManifest.js";
import { REPOSITORY_URL } from "./Chrome.js";
import { createDocumentHref } from "./documentRouting.js";
import {
    createDocumentOutline,
    markdownRehypePlugins,
    markdownRemarkPlugins
} from "./markdown.js";

const resolveRepositoryPath = (currentPath: string, href: string): string => {
    const currentDirectory = currentPath.includes("/")
        ? currentPath.slice(0, currentPath.lastIndexOf("/") + 1)
        : "";
    return new URL(href, `https://repository.invalid/${currentDirectory}`)
        .pathname
        .replace(/^\//, "");
};

interface DocsProps {
    activeId: DocumentId;
    baseUrl: string;
    documents: readonly DocumentSource[];
}

interface DocumentGroup {
    category: DocumentCategory;
    documents: DocumentSource[];
}

const groupDocuments = (documents: readonly DocumentSource[]): readonly DocumentGroup[] => {
    const groups: DocumentGroup[] = [];

    for (const document of documents) {
        const currentGroup = groups.at(-1);
        if (currentGroup?.category === document.category) {
            currentGroup.documents.push(document);
        } else {
            groups.push({ category: document.category, documents: [document] });
        }
    }

    return groups;
};

export default function Docs({ activeId, baseUrl, documents }: DocsProps) {
    const activeDocument = documents.find(({ id }) => id === activeId) ?? documents[0]!;
    const documentGroups = groupDocuments(documents);
    const outline = useMemo(
        () => createDocumentOutline(activeDocument.source),
        [activeDocument.source]
    );
    const documentNavigation = documentGroups.map((group) => (
        <details
            className="docs-nav-group"
            key={group.category}
            open={group.documents.some(({ id }) => id === activeId)}
        >
            <summary>{group.category}</summary>
            <div className="docs-nav-links">
                {group.documents.map((document) => (
                    <a
                        className={`docs-nav-link${activeId === document.id ? " is-active" : ""}`}
                        key={document.id}
                        href={createDocumentHref(baseUrl, document)}
                        aria-current={activeId === document.id ? "page" : undefined}
                    >
                        {document.label}
                    </a>
                ))}
            </div>
        </details>
    ));
    const markdownComponents = useMemo<Components>(() => ({
        a: ({ href, children, node: _node, ...props }) => {
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
                        href={createDocumentHref(baseUrl, document, anchor)}
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
    }), [activeDocument.githubPath, baseUrl, documents]);

    return (
        <section className="docs-section" aria-label="Repository documentation">
            <div className="docs-shell">
                <aside className="docs-nav">
                    <nav
                        className="docs-nav-groups docs-nav-groups--desktop"
                        aria-label="Documentation pages"
                    >
                        {documentNavigation}
                    </nav>
                    <details className="docs-nav-disclosure">
                        <summary>
                            <span>Documentation</span>{" "}
                            <strong>{activeDocument.label}</strong>
                        </summary>
                        <nav
                            className="docs-nav-groups docs-nav-groups--mobile"
                            aria-label="Documentation pages"
                        >
                            {documentNavigation}
                        </nav>
                    </details>
                </aside>

                <article className="markdown-document" id="document">
                    <div className="docs-toolbar">
                        <nav className="docs-breadcrumb" aria-label="Breadcrumb">
                            <a href={`${baseUrl}docs/`}>Docs</a>
                            <span aria-hidden="true">/</span>
                            <span aria-current="page">{activeDocument.label}</span>
                        </nav>
                        <a
                            href={`${REPOSITORY_URL}/blob/main/${activeDocument.githubPath}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            View on GitHub <span aria-hidden="true">↗</span>
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

                {outline.length > 1 ? (
                    <aside className="docs-outline" aria-label="On this page">
                        <p>On this page</p>
                        <nav>
                            <ol>
                                {outline.map((item) => (
                                    <li className={`docs-outline-level-${item.level}`} key={item.id}>
                                        <a href={`#${item.id}`}>{item.label}</a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </aside>
                ) : null}
            </div>
        </section>
    );
}
