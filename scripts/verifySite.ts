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
    tagName: "img" | "link" | "meta"
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
    assert.doesNotMatch(html, /__(?:(?:HOME|DOCUMENT)_[A-Z_]+|CURRENT_RELEASE)__/);
    assert.doesNotMatch(html, /<meta[^>]+(?:name|property)="robots"[^>]+noindex/i);
    assert.doesNotMatch(html, /<div id="root"><\/div>/);

    for (const image of readElements(html, "img")) {
        const source = image.src;
        if (!source?.startsWith(siteMetadata.basePath)) continue;
        const publicPath = source.slice(siteMetadata.basePath.length);
        assert.ok(
            existsSync(resolve(outputRoot, publicPath)),
            `${outputPath} references missing public image ${source}.`
        );
    }
};

await verifyPage("index.html", {
    title: siteMetadata.title,
    socialTitle: siteMetadata.socialTitle,
    description: siteMetadata.description,
    socialDescription: siteMetadata.socialDescription,
    url: siteMetadata.url
});

const homepage = await readFile(resolve(outputRoot, "index.html"), "utf8");
assertMetadata(
    readElements(homepage, "meta"),
    { name: "google-site-verification" },
    siteMetadata.googleSiteVerification,
    "index.html"
);
const structuredDataBlocks = Array.from(
    homepage.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    ([, source]) => JSON.parse(source!) as { "@graph"?: readonly Record<string, unknown>[] }
);
assert.equal(structuredDataBlocks.length, 1, "The homepage must contain one JSON-LD block.");
const sourceCode = structuredDataBlocks[0]!["@graph"]?.find(
    (entry) => entry["@type"] === "SoftwareSourceCode"
);
assert.ok(sourceCode, "The homepage must describe ChronoLaneJS as SoftwareSourceCode.");
assert.deepEqual(sourceCode, {
    "@type": "SoftwareSourceCode",
    name: "ChronoLaneJS",
    description: siteMetadata.socialDescription,
    url: siteMetadata.url,
    codeRepository: "https://github.com/MaximilianWalker/ChronoLaneJS",
    license: "https://github.com/MaximilianWalker/ChronoLaneJS/blob/main/LICENSE",
    programmingLanguage: ["TypeScript", "JavaScript"],
    runtimePlatform: ["React 18", "React 19", "Modern web browsers"],
    version: siteMetadata.currentRelease,
    sameAs: [
        "https://github.com/MaximilianWalker/ChronoLaneJS",
        "https://www.npmjs.com/package/@chronolanejs/react"
    ]
});

const changelog = await readFile(resolve(repositoryRoot, "CHANGELOG.md"), "utf8");
const latestRelease = /^## \[(\d+\.\d+\.\d+)]/m.exec(changelog)?.[1];
assert.equal(
    siteMetadata.currentRelease,
    latestRelease,
    "Structured data must identify the latest published changelog release."
);

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
