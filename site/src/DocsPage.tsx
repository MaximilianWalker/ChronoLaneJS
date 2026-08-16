import { Footer, Header, REPOSITORY_URL } from "./Chrome.js";
import Docs from "./Docs.js";

export default function DocsPage() {
    return (
        <div className="site-shell docs-page">
            <a className="skip-link" href="#main">Skip to content</a>
            <Header activePage="docs" />

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

                <Docs />
            </main>

            <Footer />
        </div>
    );
}
