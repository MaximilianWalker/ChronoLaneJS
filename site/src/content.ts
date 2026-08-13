import contributing from "../../CONTRIBUTING.md?raw";
import accessibility from "../../docs/accessibility.md?raw";
import api from "../../docs/api.md?raw";
import examples from "../../docs/examples.md?raw";
import gettingStarted from "../../docs/getting-started.md?raw";
import documentation from "../../docs/README.md?raw";
import styling from "../../docs/styling.md?raw";
import readme from "../../README.md?raw";
import roadmap from "../../ROADMAP.md?raw";
import security from "../../SECURITY.md?raw";

export type DocumentId =
    | "documentation"
    | "getting-started"
    | "api"
    | "styling"
    | "examples"
    | "accessibility"
    | "overview"
    | "contributing"
    | "roadmap"
    | "security";

export type DocumentCategory = "Consumer guides" | "Project";

export interface DocumentSource {
    id: DocumentId;
    category: DocumentCategory;
    label: string;
    description: string;
    source: string;
    githubPath: string;
}

const readmeBody = readme.replace(/^[\s\S]*?\r?\n---\r?\n/, "");

export const documents: readonly DocumentSource[] = [
    {
        id: "documentation",
        category: "Consumer guides",
        label: "Documentation home",
        description: "Choose the right guide and understand the documentation contract",
        source: documentation,
        githubPath: "docs/README.md"
    },
    {
        id: "getting-started",
        category: "Consumer guides",
        label: "Getting started",
        description: "Events, state, timezones, ranges, resources, and interactions",
        source: gettingStarted,
        githubPath: "docs/getting-started.md"
    },
    {
        id: "api",
        category: "Consumer guides",
        label: "API reference",
        description: "Every export, prop, payload, default, function, and error",
        source: api,
        githubPath: "docs/api.md"
    },
    {
        id: "styling",
        category: "Consumer guides",
        label: "Styling and theming",
        description: "Tokens, dimensions, stable classes, renderers, and responsive behavior",
        source: styling,
        githubPath: "docs/styling.md"
    },
    {
        id: "examples",
        category: "Consumer guides",
        label: "Examples",
        description: "Vite, Next.js, state, resources, localization, and custom rendering",
        source: examples,
        githubPath: "docs/examples.md"
    },
    {
        id: "accessibility",
        category: "Consumer guides",
        label: "Accessibility",
        description: "Keyboard behavior, names, focus, drag limitations, and responsibilities",
        source: accessibility,
        githubPath: "docs/accessibility.md"
    },
    {
        id: "overview",
        category: "Project",
        label: "Repository overview",
        description: "Project introduction, feature overview, and runtime support",
        source: readmeBody,
        githubPath: "README.md"
    },
    {
        id: "contributing",
        category: "Project",
        label: "Contributing",
        description: "Development workflow and project conventions",
        source: contributing,
        githubPath: "CONTRIBUTING.md"
    },
    {
        id: "roadmap",
        category: "Project",
        label: "Roadmap",
        description: "Release gates and the canonical project backlog",
        source: roadmap,
        githubPath: "ROADMAP.md"
    },
    {
        id: "security",
        category: "Project",
        label: "Security",
        description: "How to report vulnerabilities responsibly",
        source: security,
        githubPath: "SECURITY.md"
    }
] as const;

export const isDocumentId = (value: string): value is DocumentId => (
    documents.some(({ id }) => id === value)
);
