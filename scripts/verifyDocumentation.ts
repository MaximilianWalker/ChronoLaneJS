import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";

import ts from "typescript";

const repositoryRoot = resolve(import.meta.dirname, "..");
const apiPath = resolve(repositoryRoot, "docs/api.md");
const publicEntryPath = resolve(repositoryRoot, "src/index.ts");
const apiSource = await readFile(apiPath, "utf8");

const markerValues = (name: "api" | "props"): string[] => Array.from(
    apiSource.matchAll(new RegExp(`<!-- ${name}:[^>]+-->`, "g")),
    ([marker]) => marker
        .replace(`<!-- ${name}:`, "")
        .replace("-->", "")
        .trim()
).flatMap((value) => value.split(/\s+/));

const documentedExports = new Set(markerValues("api"));
const documentedProps = new Set(Array.from(
    apiSource.matchAll(/<!-- props:([^>]+)-->/g),
    ([, marker]) => marker!.trim().split(/\s+/)
).flatMap(([interfaceName, ...properties]) => (
    properties.map((property) => `${interfaceName}.${property}`)
)));
const program = ts.createProgram([publicEntryPath], {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    target: ts.ScriptTarget.ESNext
});
const checker = program.getTypeChecker();
const entry = program.getSourceFile(publicEntryPath);
assert.ok(entry, "The public package entry must be readable.");
const entrySymbol = checker.getSymbolAtLocation(entry);
assert.ok(entrySymbol, "The public package entry must have a module symbol.");

const publicExports = checker.getExportsOfModule(entrySymbol).map(({ name }) => name);
const undocumentedExports = publicExports.filter((name) => !documentedExports.has(name));
assert.deepEqual(
    undocumentedExports,
    [],
    `docs/api.md is missing public exports: ${undocumentedExports.join(", ")}`
);

const publicProperties = new Set<string>();
for (const symbol of checker.getExportsOfModule(entrySymbol)) {
    const target = symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;
    for (const declaration of target.declarations ?? []) {
        if (!ts.isInterfaceDeclaration(declaration)) continue;
        for (const member of declaration.members) {
            if (ts.isPropertySignature(member)) {
                const propertyName = member.name.getText().replaceAll('"', "");
                publicProperties.add(`${symbol.name}.${propertyName}`);
            }
        }
    }
}

const undocumentedProps = [...publicProperties]
    .filter((property) => !documentedProps.has(property))
    .sort();
assert.deepEqual(
    undocumentedProps,
    [],
    `docs/api.md is missing public properties: ${undocumentedProps.join(", ")}`
);

const markdownFiles = [
    "README.md",
    "CONTRIBUTING.md",
    "ROADMAP.md",
    "SECURITY.md",
    ...(await readdir(resolve(repositoryRoot, "docs")))
        .filter((name) => extname(name) === ".md")
        .map((name) => `docs/${name}`)
];

for (const markdownFile of markdownFiles) {
    const markdownPath = resolve(repositoryRoot, markdownFile);
    const markdown = await readFile(markdownPath, "utf8");
    for (const [, href] of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        if (!href || /^(?:#|https?:|mailto:)/.test(href)) continue;
        const decodedPath = decodeURIComponent(href.split("#", 1)[0] ?? "");
        if (!decodedPath) continue;
        const targetPath = resolve(dirname(markdownPath), decodedPath);
        assert.ok(
            existsSync(targetPath),
            `${markdownFile} links to missing repository path ${href}`
        );
    }
}

const siteContent = await readFile(resolve(repositoryRoot, "site/src/content.ts"), "utf8");
for (const markdownFile of markdownFiles.filter((file) => file.startsWith("docs/"))) {
    assert.match(
        siteContent,
        new RegExp(markdownFile.split("/").at(-1)!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${markdownFile} must be rendered by the GitHub Pages documentation site.`
    );
}

console.log(
    `Verified ${publicExports.length} public exports, ${publicProperties.size} public interface properties, ${markdownFiles.length} Markdown files, and GitHub Pages coverage.`
);
