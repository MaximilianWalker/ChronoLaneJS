import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { documents } from "./content.js";
import { documentDefinitions, isDocumentId } from "./documentManifest.js";
import {
    createDocumentHref,
    findDocumentByPath,
    parseLegacyDocumentLocation
} from "./documentRouting.js";
import DocsPage from "./DocsPage.js";

const root = document.getElementById("root");

if (!root) throw new Error("Documentation root element was not found.");

const baseUrl = import.meta.env.BASE_URL;
const legacyLocation = parseLegacyDocumentLocation(window.location.hash, isDocumentId);

const updateMetadata = (activeDocument: (typeof documentDefinitions)[number]) => {
    const url = new URL(`${baseUrl}${activeDocument.route}`, window.location.origin).href;
    document.title = activeDocument.title;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')
        ?.setAttribute("content", activeDocument.metaDescription);
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
        ?.setAttribute("href", url);
    for (const property of ["og:title", "twitter:title"]) {
        document.querySelector<HTMLMetaElement>(`meta[property="${property}"], meta[name="${property}"]`)
            ?.setAttribute("content", activeDocument.title);
    }
    for (const property of ["og:description", "twitter:description"]) {
        document.querySelector<HTMLMetaElement>(`meta[property="${property}"], meta[name="${property}"]`)
            ?.setAttribute("content", activeDocument.metaDescription);
    }
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
        ?.setAttribute("content", url);
};

if (legacyLocation) {
    const legacyDocument = documentDefinitions.find(({ id }) => id === legacyLocation.id)
        ?? documentDefinitions[0]!;
    window.location.replace(createDocumentHref(
        baseUrl,
        legacyDocument,
        legacyLocation.anchor
    ));
} else {
    const activeDocument = findDocumentByPath(window.location.pathname, baseUrl)
        ?? documentDefinitions[0]!;
    updateMetadata(activeDocument);
    const page = (
        <StrictMode>
            <DocsPage
                activeId={activeDocument.id}
                baseUrl={baseUrl}
                documents={documents}
            />
        </StrictMode>
    );

    createRoot(root).render(page);
}
