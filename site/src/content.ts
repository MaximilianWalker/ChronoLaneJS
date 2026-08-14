import development from "../../DEVELOPMENT.md?raw";
import readme from "../../README.md?raw";
import roadmap from "../../ROADMAP.md?raw";
import security from "../../SECURITY.md?raw";

export type DocumentId = "overview" | "development" | "roadmap" | "security";

export interface DocumentSource {
    id: DocumentId;
    label: string;
    description: string;
    source: string;
    githubPath: string;
}

const readmeBody = readme.replace(/^[\s\S]*?\r?\n---\r?\n/, "");

export const documents: readonly DocumentSource[] = [
    {
        id: "overview",
        label: "Overview",
        description: "Installation, concepts, customization, and public API",
        source: readmeBody,
        githubPath: "README.md"
    },
    {
        id: "development",
        label: "Development guide",
        description: "Coding standards, validation requirements, and release workflow",
        source: development,
        githubPath: "DEVELOPMENT.md"
    },
    {
        id: "roadmap",
        label: "Roadmap",
        description: "Release gates and the canonical project backlog",
        source: roadmap,
        githubPath: "ROADMAP.md"
    },
    {
        id: "security",
        label: "Security",
        description: "How to report vulnerabilities responsibly",
        source: security,
        githubPath: "SECURITY.md"
    }
] as const;

export const isDocumentId = (value: string): value is DocumentId => (
    documents.some(({ id }) => id === value)
);
