import { lazy, Suspense } from "react";

import Playground from "./Playground.js";

const REPOSITORY_URL = "https://github.com/MaximilianWalker/ChronoLaneJS";
const Docs = lazy(() => import("./Docs.js"));

export default function App() {
    return (
        <div className="site-shell">
            <a className="skip-link" href="#main">Skip to content</a>

            <header className="site-header">
                <a className="brand" href="#top" aria-label="ChronoLaneJS home">
                    <img src={`${import.meta.env.BASE_URL}chronolane-logo.svg`} alt="" />
                    <span>ChronoLane<span className="brand-js">JS</span></span>
                </a>
                <nav aria-label="Primary navigation">
                    <a href="#playground">Playground</a>
                    <a href="#docs">Docs</a>
                    <a href={`${import.meta.env.BASE_URL}storybook/`}>Storybook</a>
                </nav>
                <a className="github-link" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
                    GitHub
                    <span aria-hidden="true">↗</span>
                </a>
            </header>

            <main id="main">
                <section className="hero section" id="top">
                    <div className="hero-copy">
                        <div className="hero-kicker">
                            <span className="status-dot" aria-hidden="true" />
                            Open source · MIT licensed
                        </div>
                        <h1>
                            Calendar infrastructure,
                            <span> shaped by you.</span>
                        </h1>
                        <p className="hero-summary">
                            A composable, timezone-aware React toolkit for
                            scheduling interfaces that should feel native to
                            your product—not ours.
                        </p>
                        <div className="hero-actions">
                            <a className="button button--primary" href="#playground">
                                Try the playground
                                <span aria-hidden="true">↓</span>
                            </a>
                            <a className="button button--secondary" href="#docs">
                                Read the docs
                            </a>
                        </div>
                        <div className="install-command" aria-label="Installation command">
                            <span aria-hidden="true">$</span>
                            <code>npm install @chronolanejs/react</code>
                            <span className="command-note">First release in progress</span>
                        </div>
                    </div>

                    <div className="hero-visual" role="img" aria-label="A sample weekly schedule">
                        <div className="hero-visual-glow" />
                        <div className="schedule-card" aria-hidden="true">
                            <div className="schedule-topbar">
                                <div>
                                    <span className="schedule-overline">September 2026</span>
                                    <strong>Product week</strong>
                                </div>
                                <div className="schedule-controls" aria-hidden="true">
                                    <span>‹</span><span>›</span>
                                </div>
                            </div>
                            <div className="schedule-grid">
                                <div className="schedule-time-labels" aria-hidden="true">
                                    <span>09</span><span>11</span><span>13</span><span>15</span>
                                </div>
                                <div className="schedule-day">
                                    <div><strong>MON</strong><span>14</span></div>
                                    <i className="schedule-event event-blue" style={{ top: "18%", height: "22%" }}>
                                        Planning
                                    </i>
                                    <i className="schedule-event event-violet" style={{ top: "48%", height: "18%" }}>
                                        Review
                                    </i>
                                </div>
                                <div className="schedule-day">
                                    <div><strong>TUE</strong><span>15</span></div>
                                    <i className="schedule-event event-cyan" style={{ top: "32%", height: "28%" }}>
                                        Research
                                    </i>
                                </div>
                                <div className="schedule-day">
                                    <div><strong>WED</strong><span>16</span></div>
                                    <i className="schedule-event event-orange" style={{ top: "22%", height: "34%" }}>
                                        Docs
                                    </i>
                                </div>
                                <div className="schedule-day">
                                    <div><strong>THU</strong><span>17</span></div>
                                    <i className="schedule-focus" style={{ top: "55%", height: "25%" }} />
                                </div>
                            </div>
                            <div className="schedule-caption">
                                <span className="schedule-avatar">CL</span>
                                <span><strong>Timezone-safe</strong> across every visible lane</span>
                                <span className="schedule-zone">Europe/Lisbon</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="proof-strip" aria-label="Library highlights">
                    <div><strong>6</strong><span>Built-in views</span></div>
                    <div><strong>IANA</strong><span>Timezone aware</span></div>
                    <div><strong>18—19</strong><span>React support</span></div>
                    <div><strong>0</strong><span>State assumptions</span></div>
                </section>

                <Playground />

                <section className="principles section" aria-labelledby="principles-title">
                    <div className="section-heading">
                        <p className="eyebrow">Designed for real products</p>
                        <h2 id="principles-title">The hard calendar parts,<br />without the product opinions.</h2>
                    </div>
                    <div className="principle-grid">
                        <article>
                            <span>01</span>
                            <h3>Own your state</h3>
                            <p>
                                Use controlled or uncontrolled navigation and
                                connect selections, edits, and drops to any data layer.
                            </p>
                        </article>
                        <article>
                            <span>02</span>
                            <h3>Own your presentation</h3>
                            <p>
                                Replace meaningful render boundaries while the
                                library continues to own layout and calendar behavior.
                            </p>
                        </article>
                        <article>
                            <span>03</span>
                            <h3>Trust the timeline</h3>
                            <p>
                                IANA zones, locale conventions, overlap lanes,
                                clipping, and custom ranges stay explicit and testable.
                            </p>
                        </article>
                    </div>
                </section>

                <Suspense fallback={<div className="docs-loading section">Loading documentation…</div>}>
                    <Docs />
                </Suspense>

                <section className="closing section">
                    <img src={`${import.meta.env.BASE_URL}chronolane-logo.svg`} alt="" />
                    <p className="eyebrow">Build the schedule your product needs</p>
                    <h2>Start with the model.<br />Make the interface yours.</h2>
                    <div className="hero-actions">
                        <a className="button button--primary" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
                            View on GitHub <span aria-hidden="true">↗</span>
                        </a>
                        <a className="button button--secondary" href="#playground">Open playground</a>
                    </div>
                </section>
            </main>

            <footer className="site-footer">
                <div className="brand brand--footer">
                    <img src={`${import.meta.env.BASE_URL}chronolane-logo.svg`} alt="" />
                    <span>ChronoLaneJS</span>
                </div>
                <p>Composable, timezone-aware scheduling for React.</p>
                <div>
                    <a href={`${REPOSITORY_URL}/blob/main/LICENSE`}>MIT License</a>
                    <a href="#docs/security">Security</a>
                    <a href={`${REPOSITORY_URL}/issues`}>Issues</a>
                </div>
            </footer>
        </div>
    );
}
