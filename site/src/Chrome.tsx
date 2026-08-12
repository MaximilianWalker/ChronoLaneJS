export const REPOSITORY_URL = "https://github.com/MaximilianWalker/ChronoLaneJS";

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
            </nav>
            <a className="github-link" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
                GitHub
                <span aria-hidden="true">↗</span>
            </a>
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
            <div>
                <a href={`${REPOSITORY_URL}/blob/main/LICENSE`}>MIT License</a>
                <a href={`${baseUrl}docs/#doc-security`}>Security</a>
                <a href={`${REPOSITORY_URL}/issues`}>Issues</a>
            </div>
        </footer>
    );
}
