import type { DocumentSource } from "./content.js";
import type { DocumentId } from "./documentManifest.js";
import { Footer, Header, REPOSITORY_URL } from "./Chrome.js";
import Docs from "./Docs.js";

interface DocsPageProps {
    activeId: DocumentId;
    baseUrl: string;
    documents: readonly DocumentSource[];
}

export default function DocsPage({ activeId, baseUrl, documents }: DocsPageProps) {
    return (
        <div className="site-shell docs-page">
            <a className="skip-link" href="#main">Skip to content</a>
            <Header activePage="docs" baseUrl={baseUrl} />

            <main className="docs-main section" id="main">
                <header className="docs-intro">
                    <div>
                        <p className="eyebrow">Documentation</p>
                        <h1>Build on a clear<br />calendar model.</h1>
                    </div>
                    <div className="docs-intro-copy">
                        <p>
                            Every component, prop, callback, example, styling
                            hook, and accessibility obligation—rendered from
                            the same Markdown you see on GitHub.
                        </p>
                        <a href={`${REPOSITORY_URL}/blob/main/docs/README.md`} target="_blank" rel="noreferrer">
                            Browse the source on GitHub <span aria-hidden="true">↗</span>
                        </a>
                    </div>
                </header>

                <Docs activeId={activeId} baseUrl={baseUrl} documents={documents} />
            </main>

            <Footer baseUrl={baseUrl} />
        </div>
    );
}
