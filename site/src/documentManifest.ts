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
    | "roadmap"
    | "security";

export type DocumentCategory = "Start" | "Guides" | "Reference" | "Releases" | "Project";

export interface DocumentDefinition {
    id: DocumentId;
    category: DocumentCategory;
    label: string;
    metaDescription: string;
    title: string;
    route: string;
    githubPath: string;
}

export const documentDefinitions: readonly DocumentDefinition[] = [
    {
        id: "documentation",
        category: "Start",
        label: "Overview",
        metaDescription: "ChronoLaneJS documentation for building accessible React and TypeScript calendars with scheduling, resources, interactions, and timezone-aware behavior.",
        title: "React Calendar Documentation — ChronoLaneJS",
        route: "docs/",
        githubPath: "docs/README.md"
    },
    {
        id: "getting-started",
        category: "Start",
        label: "Getting started",
        metaDescription: "Install ChronoLaneJS and build a React calendar with typed events, controlled state, timezones, resource columns, selection, movement, and resizing.",
        title: "Getting Started with the ChronoLaneJS React Calendar",
        route: "docs/getting-started/",
        githubPath: "docs/getting-started.md"
    },
    {
        id: "examples",
        category: "Guides",
        label: "Examples",
        metaDescription: "ChronoLaneJS React calendar examples for Vite and Next.js, including controlled state, resources, localization, interactions, and custom renderers.",
        title: "React Calendar Examples for Vite and Next.js — ChronoLaneJS",
        route: "docs/examples/",
        githubPath: "docs/examples.md"
    },
    {
        id: "styling",
        category: "Guides",
        label: "Styling and theming",
        metaDescription: "Style and theme the ChronoLaneJS React calendar with CSS variables, stable classes, custom renderers, responsive sizing, and layout tokens.",
        title: "React Calendar Styling and Theming — ChronoLaneJS",
        route: "docs/styling/",
        githubPath: "docs/styling.md"
    },
    {
        id: "accessibility",
        category: "Guides",
        label: "Accessibility",
        metaDescription: "Accessibility guide for the ChronoLaneJS React calendar, including keyboard navigation, focus, accessible names, event movement, resizing, and custom renderers.",
        title: "Accessible React Calendar and Keyboard Guide — ChronoLaneJS",
        route: "docs/accessibility/",
        githubPath: "docs/accessibility.md"
    },
    {
        id: "api",
        category: "Reference",
        label: "API reference",
        metaDescription: "Complete ChronoLaneJS React calendar API reference covering components, props, callbacks, renderers, TypeScript types, defaults, payloads, and errors.",
        title: "React Calendar API Reference — ChronoLaneJS",
        route: "docs/api/",
        githubPath: "docs/api.md"
    },
    {
        id: "migration-v2",
        category: "Releases",
        label: "Upgrade to v2",
        metaDescription: "Migrate ChronoLaneJS from v1 to v2 with a complete guide to breaking React calendar contracts, renamed APIs, changed defaults, and verification.",
        title: "Migrate ChronoLaneJS from v1 to v2",
        route: "docs/migrations/v2/",
        githubPath: "docs/migrations/v2.md"
    },
    {
        id: "changelog",
        category: "Releases",
        label: "Changelog",
        metaDescription: "ChronoLaneJS changelog with consumer-facing React calendar changes, release history, upgrade context, and links to major-version migration guides.",
        title: "ChronoLaneJS Changelog and Release History",
        route: "docs/changelog/",
        githubPath: "CHANGELOG.md"
    },
    {
        id: "overview",
        category: "Project",
        label: "About ChronoLaneJS",
        metaDescription: "Overview of the ChronoLaneJS open-source React and TypeScript calendar, its views, scheduling capabilities, installation, runtime support, and public API.",
        title: "ChronoLaneJS Project Overview",
        route: "docs/project/overview/",
        githubPath: "README.md"
    },
    {
        id: "roadmap",
        category: "Project",
        label: "Roadmap",
        metaDescription: "The ChronoLaneJS roadmap for React calendar correctness, APIs, interactions, accessibility, performance, documentation, and project discovery.",
        title: "ChronoLaneJS Roadmap",
        route: "docs/project/roadmap/",
        githubPath: "ROADMAP.md"
    },
    {
        id: "security",
        category: "Project",
        label: "Security",
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
        ? `# About ChronoLaneJS\n\n${source
            .replace(/^[\s\S]*?\r?\n---\r?\n/, "")
            .trimStart()}`
        : source
);
