import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { documentDefinitions } from "../site/src/documentManifest.js";
import { createPublicUrl, siteMetadata } from "../site/src/siteMetadata.js";

const repositoryRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(repositoryRoot, "site-dist");

interface PageMetadata {
    title: string;
    socialTitle: string;
    description: string;
    socialDescription: string;
    url: string;
}

const readElements = (
    html: string,
    tagName: "link" | "meta"
): readonly Readonly<Record<string, string>>[] => Array.from(
    html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "g")),
    ([tag]) => Object.fromEntries(Array.from(
        tag.matchAll(/([:\w-]+)="([^"]*)"/g),
        ([, name, value]) => [name!, value!]
    ))
);

const assertMetadata = (
    elements: readonly Readonly<Record<string, string>>[],
    selector: Readonly<Record<string, string>>,
    expectedContent: string,
    pageName: string
): void => {
    const matches = elements.filter((element) => Object.entries(selector).every(
        ([name, value]) => element[name] === value
    ));
    assert.equal(matches.length, 1, `${pageName} must contain one ${JSON.stringify(selector)}.`);
    const contentAttribute = selector.rel === "canonical" ? "href" : "content";
    assert.equal(matches[0]![contentAttribute], expectedContent);
};

const verifyPage = async (
    outputPath: string,
    metadata: PageMetadata
): Promise<void> => {
    const html = await readFile(resolve(outputRoot, outputPath), "utf8");
    const titles = Array.from(html.matchAll(/<title>([^<]+)<\/title>/g), ([, title]) => title);
    assert.deepEqual(titles, [metadata.title], `${outputPath} must contain its unique title.`);

    const meta = readElements(html, "meta");
    const links = readElements(html, "link");
    assertMetadata(meta, { name: "description" }, metadata.description, outputPath);
    assertMetadata(links, { rel: "canonical" }, metadata.url, outputPath);
    assertMetadata(meta, { property: "og:title" }, metadata.socialTitle, outputPath);
    assertMetadata(meta, { property: "og:description" }, metadata.socialDescription, outputPath);
    assertMetadata(meta, { property: "og:url" }, metadata.url, outputPath);
    assertMetadata(meta, { name: "twitter:title" }, metadata.socialTitle, outputPath);
    assertMetadata(meta, { name: "twitter:description" }, metadata.socialDescription, outputPath);
    assert.doesNotMatch(html, /__(?:HOME|DOCUMENT)_[A-Z_]+__/);
    assert.doesNotMatch(html, /<meta[^>]+(?:name|property)="robots"[^>]+noindex/i);
    assert.doesNotMatch(html, /<div id="root"><\/div>/);
};

await verifyPage("index.html", {
    title: siteMetadata.title,
    socialTitle: siteMetadata.socialTitle,
    description: siteMetadata.description,
    socialDescription: siteMetadata.socialDescription,
    url: siteMetadata.url
});

for (const definition of documentDefinitions) {
    await verifyPage(`${definition.route}index.html`, {
        title: definition.title,
        socialTitle: definition.title,
        description: definition.metaDescription,
        socialDescription: definition.metaDescription,
        url: createPublicUrl(definition.route)
    });
}

const expectedUrls = [
    siteMetadata.url,
    ...documentDefinitions.map(({ route }) => createPublicUrl(route))
];
assert.equal(new Set(expectedUrls).size, expectedUrls.length, "Canonical URLs must be unique.");

const sitemap = await readFile(resolve(outputRoot, "sitemap.xml"), "utf8");
const sitemapUrls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), ([, url]) => url!);
assert.deepEqual(sitemapUrls, expectedUrls, "The sitemap must contain every canonical page once.");
for (const url of sitemapUrls) {
    assert.ok(url.startsWith(siteMetadata.url), `${url} must use the public site URL prefix.`);
    assert.equal(new URL(url).protocol, "https:", `${url} must use HTTPS.`);
}

assert.equal(
    existsSync(resolve(outputRoot, "robots.txt")),
    false,
    "Do not publish a project-path robots.txt; it cannot control the github.io host."
);

console.log(`Verified search metadata and sitemap coverage for ${expectedUrls.length} pages.`);
