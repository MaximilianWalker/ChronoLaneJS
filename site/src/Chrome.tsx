export const REPOSITORY_URL = "https://github.com/MaximilianWalker/ChronoLaneJS";
export const SUPPORT_URL = "https://www.buymeacoffee.com/MaximilianWalker";

export function CoffeeIcon() {
    return (
        <svg className="coffee-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8Z" />
            <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
            <path d="M8 5V3m4 2V3M4 21h14" />
        </svg>
    );
}

interface HeaderProps {
    activePage: "home" | "docs";
}

export function Header({ activePage }: HeaderProps) {
    const baseUrl = import.meta.env.BASE_URL;

    return (
        <header className="site-header">
            <a className="brand" href={baseUrl} aria-label="ChronoLaneJS home">
                <img src={`${baseUrl}chronolane-logo.svg`} alt="" />
                <span>ChronoLane<span className="brand-js">JS</span></span>
            </a>
            <nav aria-label="Primary navigation">
                <a href={`${baseUrl}#playground`}>Playground</a>
                <a
                    href={`${baseUrl}docs/`}
                    aria-current={activePage === "docs" ? "page" : undefined}
                >
                    Docs
                </a>
                <a href={`${baseUrl}storybook/`}>Storybook</a>
                <a href={`${baseUrl}#author`}>Author</a>
            </nav>
            <div className="header-actions">
                <a
                    className="support-link"
                    href={SUPPORT_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Buy me a coffee"
                >
                    <CoffeeIcon />
                    <span>Coffee</span>
                </a>
                <a className="github-link" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
                    GitHub
                    <span aria-hidden="true">↗</span>
                </a>
            </div>
        </header>
    );
}

export function Footer() {
    const baseUrl = import.meta.env.BASE_URL;

    return (
        <footer className="site-footer">
            <div className="brand brand--footer">
                <img src={`${baseUrl}chronolane-logo.svg`} alt="" />
                <span>ChronoLaneJS</span>
            </div>
            <p>A modern, timezone-aware calendar for React.</p>
            <div className="site-footer-links">
                <a href={`${REPOSITORY_URL}/blob/main/LICENSE`}>MIT License</a>
                <a href={`${baseUrl}docs/#doc-security`}>Security</a>
                <a href={`${REPOSITORY_URL}/issues`}>Issues</a>
            </div>
        </footer>
    );
}
