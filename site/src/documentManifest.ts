export type DocumentId =
    | "documentation"
    | "getting-started"
    | "interactions"
    | "resources"
    | "time-zones"
    | "api"
    | "styling"
    | "renderers"
    | "framework-integration"
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
        id: "interactions",
        category: "Guides",
        label: "Drag and resize events",
        metaDescription: "Add pointer, touch, and keyboard event drag-and-drop and resizing to a controlled React calendar with ChronoLaneJS.",
        title: "Drag and Resize Events in a React Calendar — ChronoLaneJS",
        route: "docs/event-interactions/",
        githubPath: "docs/interactions.md"
    },
    {
        id: "resources",
        category: "Guides",
        label: "Resource scheduling",
        metaDescription: "Build a typed React resource calendar for rooms, people, or equipment with grouped columns and multi-resource events.",
        title: "React Resource Calendar and Scheduler — ChronoLaneJS",
        route: "docs/resource-scheduling/",
        githubPath: "docs/resources.md"
    },
    {
        id: "time-zones",
        category: "Guides",
        label: "Time zones and locales",
        metaDescription: "Handle IANA time zones, absolute timestamps, wall-clock events, daylight-saving transitions, locales, and messages in a React calendar.",
        title: "Time Zone Aware React Calendar and Localization — ChronoLaneJS",
        route: "docs/time-zones/",
        githubPath: "docs/time-zones.md"
    },
    {
        id: "framework-integration",
        category: "Guides",
        label: "Vite and Next.js",
        metaDescription: "Integrate the ChronoLaneJS React calendar with Vite or the Next.js App Router using complete TypeScript consumer examples.",
        title: "React Calendar Integration for Vite and Next.js — ChronoLaneJS",
        route: "docs/framework-integration/",
        githubPath: "docs/framework-integration.md"
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
        id: "renderers",
        category: "Guides",
        label: "Custom renderers",
        metaDescription: "Replace event, slot, header, navigation, month, and agenda renderers in a typed React calendar without losing layout or accessibility behavior.",
        title: "Custom React Calendar Renderers — ChronoLaneJS",
        route: "docs/custom-renderers/",
        githubPath: "docs/renderers.md"
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
        label: "TypeScript API",
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
