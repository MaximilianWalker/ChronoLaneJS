import {
    documentDefinitions,
    type DocumentDefinition,
    type DocumentId
} from "./documentManifest.js";

export interface DocumentLocation {
    id: DocumentId;
    anchor?: string;
}

export const parseLegacyDocumentLocation = (
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

const normalizePath = (path: string): string => (
    path.replace(/^\/+|\/+$/g, "")
);

export const createDocumentHref = (
    baseUrl: string,
    document: DocumentDefinition,
    anchor?: string
): string => {
    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return `${normalizedBaseUrl}${document.route}${anchor ? `#${anchor}` : ""}`;
};

export const findDocumentByPath = (
    pathname: string,
    baseUrl: string
): DocumentDefinition | undefined => {
    const basePath = new URL(baseUrl, "https://chronolane.invalid").pathname;
    const relativePath = pathname.startsWith(basePath)
        ? pathname.slice(basePath.length)
        : pathname;
    const normalizedPath = normalizePath(relativePath);

    return documentDefinitions.find(({ route }) => (
        normalizePath(route) === normalizedPath
    ));
};
