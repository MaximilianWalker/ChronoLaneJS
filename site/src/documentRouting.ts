import type { DocumentId } from "./content.js";

export interface DocumentLocation {
    id: DocumentId;
    anchor?: string;
}

export const parseDocumentLocation = (
    hash: string,
    isDocumentId: (value: string) => value is DocumentId
): DocumentLocation | undefined => {
    if (!hash.startsWith("#doc-")) return undefined;

    const [documentId, anchor] = hash
        .replace(/^#doc-/, "")
        .split("/", 2);
    return {
        id: documentId && isDocumentId(documentId)
            ? documentId
            : "documentation",
        anchor: anchor || undefined
    };
};
