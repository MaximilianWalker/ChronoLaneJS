import { Footer, Header, REPOSITORY_URL } from "./Chrome.js";
import Playground from "./Playground.js";

export default function App() {
    return (
        <div className="site-shell">
            <a className="skip-link" href="#main">Skip to content</a>

            <Header activePage="home" />

            <main id="main">
                <section className="hero section" id="top">
                    <div className="hero-copy">
                        <div className="hero-kicker">
                            <span className="status-dot" aria-hidden="true" />
                            Open source · MIT licensed
                        </div>
                        <h1>
                            A modern calendar,
                            <span> built for React.</span>
                        </h1>
                        <p className="hero-summary">
                            Build day, week, month, agenda, and custom time-grid
                            views with resource columns and timezone-aware behavior.
                        </p>
                        <div className="hero-actions">
                            <a className="button button--primary" href="#playground">
                                Try the playground
                                <span aria-hidden="true">↓</span>
                            </a>
                            <a className="button button--secondary" href={`${import.meta.env.BASE_URL}docs/`}>
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
                    <div><strong>5</strong><span>Built-in views</span></div>
                    <div><strong>IANA</strong><span>Timezone aware</span></div>
                    <div><strong>18—19</strong><span>React support</span></div>
                    <div><strong>0</strong><span>State assumptions</span></div>
                </section>

                <Playground />

                <section className="principles section" aria-labelledby="principles-title">
                    <div className="section-heading">
                        <p className="eyebrow">Designed for real products</p>
                        <h2 id="principles-title">Calendar behavior<br />for real products.</h2>
                    </div>
                    <div className="principle-grid">
                        <article>
                            <span>01</span>
                            <h3>Connect your state</h3>
                            <p>
                                Use controlled or uncontrolled navigation and
                                connect selections, edits, and drops to any data layer.
                            </p>
                        </article>
                        <article>
                            <span>02</span>
                            <h3>Customize presentation</h3>
                            <p>
                                Replace meaningful render boundaries while
                                ChronoLaneJS handles layout and calendar behavior.
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

                <section className="brand-showcase section" aria-labelledby="brand-showcase-title">
                    <img
                        src={`${import.meta.env.BASE_URL}og.png`}
                        alt="ChronoLaneJS — A modern, timezone-aware calendar for React."
                        loading="lazy"
                    />
                    <div className="brand-showcase-copy">
                        <p className="eyebrow">Open source by design</p>
                        <h2 id="brand-showcase-title">Ready for real schedules.</h2>
                        <p>
                            Start with the built-in views, then customize
                            interactions and rendering for your product.
                        </p>
                        <div className="hero-actions">
                            <a className="button button--primary" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
                                View on GitHub <span aria-hidden="true">↗</span>
                            </a>
                            <a className="button button--secondary" href={`${import.meta.env.BASE_URL}docs/`}>Read the docs</a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
