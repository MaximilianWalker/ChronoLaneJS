export type DocumentId =
    | "documentation"
    | "getting-started"
    | "api"
    | "styling"
    | "examples"
    | "accessibility"
    | "migration-v2"
    | "changelog"
    | "overview"
    | "development"
    | "roadmap"
    | "security";

export type DocumentCategory = "Consumer guides" | "Releases" | "Project";

export interface DocumentDefinition {
    id: DocumentId;
    category: DocumentCategory;
    label: string;
    description: string;
    metaDescription: string;
    title: string;
    route: string;
    githubPath: string;
}

export const documentDefinitions: readonly DocumentDefinition[] = [
    {
        id: "documentation",
        category: "Consumer guides",
        label: "Documentation home",
        description: "Choose the right guide and understand the documentation contract",
        metaDescription: "ChronoLaneJS documentation for building accessible React and TypeScript calendars with scheduling, resources, interactions, and timezone-aware behavior.",
        title: "React Calendar Documentation — ChronoLaneJS",
        route: "docs/",
        githubPath: "docs/README.md"
    },
    {
        id: "getting-started",
        category: "Consumer guides",
        label: "Getting started",
        description: "Events, state, timezones, ranges, resources, and interactions",
        metaDescription: "Install ChronoLaneJS and build a React calendar with typed events, controlled state, timezones, resource columns, selection, movement, and resizing.",
        title: "Getting Started with the ChronoLaneJS React Calendar",
        route: "docs/getting-started/",
        githubPath: "docs/getting-started.md"
    },
    {
        id: "api",
        category: "Consumer guides",
        label: "API reference",
        description: "Every export, prop, payload, default, function, and error",
        metaDescription: "Complete ChronoLaneJS React calendar API reference covering components, props, callbacks, renderers, TypeScript types, defaults, payloads, and errors.",
        title: "React Calendar API Reference — ChronoLaneJS",
        route: "docs/api/",
        githubPath: "docs/api.md"
    },
    {
        id: "styling",
        category: "Consumer guides",
        label: "Styling and theming",
        description: "Tokens, dimensions, stable classes, renderers, and responsive behavior",
        metaDescription: "Style and theme the ChronoLaneJS React calendar with CSS variables, stable classes, custom renderers, responsive sizing, and layout tokens.",
        title: "React Calendar Styling and Theming — ChronoLaneJS",
        route: "docs/styling/",
        githubPath: "docs/styling.md"
    },
    {
        id: "examples",
        category: "Consumer guides",
        label: "Examples",
        description: "Vite, Next.js, state, resources, localization, and custom rendering",
        metaDescription: "ChronoLaneJS React calendar examples for Vite and Next.js, including controlled state, resources, localization, interactions, and custom renderers.",
        title: "React Calendar Examples for Vite and Next.js — ChronoLaneJS",
        route: "docs/examples/",
        githubPath: "docs/examples.md"
    },
    {
        id: "accessibility",
        category: "Consumer guides",
        label: "Accessibility",
        description: "Keyboard behavior, names, focus, drag limitations, and responsibilities",
        metaDescription: "Accessibility guide for the ChronoLaneJS React calendar, including keyboard navigation, focus, accessible names, event movement, resizing, and custom renderers.",
        title: "Accessible React Calendar and Keyboard Guide — ChronoLaneJS",
        route: "docs/accessibility/",
        githubPath: "docs/accessibility.md"
    },
    {
        id: "migration-v2",
        category: "Releases",
        label: "Migrate from v1 to v2",
        description: "Breaking contracts, before-and-after examples, and upgrade verification",
        metaDescription: "Migrate ChronoLaneJS from v1 to v2 with a complete guide to breaking React calendar contracts, renamed APIs, changed defaults, and verification.",
        title: "Migrate ChronoLaneJS from v1 to v2",
        route: "docs/migrations/v2/",
        githubPath: "docs/migrations/v2.md"
    },
    {
        id: "changelog",
        category: "Releases",
        label: "Changelog",
        description: "Curated changes and upgrade context for every published version",
        metaDescription: "ChronoLaneJS changelog with consumer-facing React calendar changes, release history, upgrade context, and links to major-version migration guides.",
        title: "ChronoLaneJS Changelog and Release History",
        route: "docs/changelog/",
        githubPath: "CHANGELOG.md"
    },
    {
        id: "overview",
        category: "Project",
        label: "Repository overview",
        description: "Project introduction, feature overview, and runtime support",
        metaDescription: "Overview of the ChronoLaneJS open-source React and TypeScript calendar, its views, scheduling capabilities, installation, runtime support, and public API.",
        title: "ChronoLaneJS Project Overview",
        route: "docs/project/overview/",
        githubPath: "README.md"
    },
    {
        id: "development",
        category: "Project",
        label: "Development guide",
        description: "Coding standards, validation requirements, and release workflow",
        metaDescription: "ChronoLaneJS contributor guide covering React architecture, documentation, validation, compatibility, release automation, and repository workflows.",
        title: "Developing ChronoLaneJS",
        route: "docs/project/development/",
        githubPath: "DEVELOPMENT.md"
    },
    {
        id: "roadmap",
        category: "Project",
        label: "Roadmap",
        description: "Release gates and the canonical project backlog",
        metaDescription: "The ChronoLaneJS roadmap for React calendar correctness, APIs, interactions, accessibility, performance, documentation, and project discovery.",
        title: "ChronoLaneJS Roadmap",
        route: "docs/project/roadmap/",
        githubPath: "ROADMAP.md"
    },
    {
        id: "security",
        category: "Project",
        label: "Security",
        description: "How to report vulnerabilities responsibly",
        metaDescription: "ChronoLaneJS security policy, supported releases, private vulnerability reporting process, disclosure expectations, and coordinated fixes.",
        title: "ChronoLaneJS Security Policy",
        route: "docs/project/security/",
        githubPath: "SECURITY.md"
    }
] as const;

export const isDocumentId = (value: string): value is DocumentId => (
    documentDefinitions.some(({ id }) => id === value)
);

export const normalizeDocumentSource = (id: DocumentId, source: string): string => (
    id === "overview"
        ? source.replace(/^[\s\S]*?\r?\n---\r?\n/, "")
        : source
);
