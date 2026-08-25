import type { DocumentSource } from "./content.js";
import type { DocumentId } from "./documentManifest.js";
import { Footer, Header } from "./Chrome.js";
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
                <Docs activeId={activeId} baseUrl={baseUrl} documents={documents} />
            </main>

            <Footer baseUrl={baseUrl} />
        </div>
    );
}
