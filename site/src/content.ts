import contributing from "../../CONTRIBUTING.md?raw";
import readme from "../../README.md?raw";
import roadmap from "../../ROADMAP.md?raw";
import security from "../../SECURITY.md?raw";

export type DocumentId = "overview" | "contributing" | "roadmap" | "security";

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
        id: "contributing",
        label: "Contributing",
        description: "Development workflow and project conventions",
        source: contributing,
        githubPath: "CONTRIBUTING.md"
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
