import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
    cp,
    lstat,
    mkdtemp,
    readFile,
    readdir,
    realpath,
    rm,
    writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

interface PackResult {
    filename: string;
    name: string;
    version: string;
}

interface ConsumerManifest {
    dependencies: Record<string, string>;
}

interface PackageMetadata {
    engines: { node: string };
    exports: {
        ".": { default: string; import: string; types: string };
        "./package.json": string;
        "./styles.css": string;
    };
    files: string[];
    main: string;
    module: string;
    name: string;
    peerDependencies: Record<string, string>;
    publishConfig: { access: string; registry: string };
    sideEffects: string[];
    types: string;
    version: string;
}

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const packageSpec = process.argv[2] ?? repositoryRoot;
const npmExecPath = process.env.npm_execpath;

assert.ok(
    process.argv.length <= 3,
    "Usage: tsx scripts/verifyConsumers.ts [package-spec]"
);
assert.ok(npmExecPath, "Consumer verification must run through npm.");

const run = (command: string, args: string[], cwd: string): void => {
    console.log(`\n> ${command} ${args.join(" ")} (${relative(repositoryRoot, cwd) || "."})`);
    execFileSync(command, args, { cwd, stdio: "inherit" });
};

const capture = (command: string, args: string[], cwd: string): string => (
    execFileSync(command, args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "inherit"]
    })
);

const runNpm = (args: string[], cwd: string): void => {
    run(process.execPath, [npmExecPath, ...args], cwd);
};

const captureNpm = (args: string[], cwd: string): string => (
    capture(process.execPath, [npmExecPath, ...args], cwd)
);

const readJson = async <Value>(path: string): Promise<Value> => (
    JSON.parse(await readFile(path, "utf8")) as Value
);

const findFiles = async (directory: string, suffix: string): Promise<string[]> => {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return findFiles(path, suffix);
        return entry.name.endsWith(suffix) ? [path] : [];
    }));
    return files.flat();
};

const installTarball = async (
    fixtureRoot: string,
    tarballPath: string
): Promise<string> => {
    const manifestPath = join(fixtureRoot, "package.json");
    const manifest = await readJson<ConsumerManifest>(manifestPath);
    const tarballReference = relative(fixtureRoot, tarballPath).split(sep).join("/");
    manifest.dependencies["@chronolanejs/react"] = `file:${tarballReference}`;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    runNpm([
        "install",
        "--package-lock-only",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund"
    ], fixtureRoot);
    runNpm(["ci", "--no-audit", "--no-fund"], fixtureRoot);

    const installedPackage = join(
        fixtureRoot,
        "node_modules",
        "@chronolanejs",
        "react"
    );
    const installedStat = await lstat(installedPackage);
    assert.equal(
        installedStat.isSymbolicLink(),
        false,
        "The packed consumer must not resolve @chronolanejs/react as a repository link"
    );

    const installedRealPath = await realpath(installedPackage);
    const nodeModulesRealPath = await realpath(join(fixtureRoot, "node_modules"));
    assert.ok(
        installedRealPath.startsWith(`${nodeModulesRealPath}${sep}`),
        "The packed package must be installed inside the clean consumer"
    );
    return installedPackage;
};

const verifyInstalledPackage = async (
    installedPackage: string,
    expected: PackResult
): Promise<void> => {
    const metadata = await readJson<PackageMetadata>(join(installedPackage, "package.json"));
    assert.equal(metadata.name, expected.name);
    assert.equal(metadata.version, expected.version);
    assert.equal(metadata.main, "./dist/index.js");
    assert.equal(metadata.module, "./dist/index.js");
    assert.equal(metadata.types, "./dist/index.d.ts");
    assert.deepEqual(metadata.exports["."], {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
        default: "./dist/index.js"
    });
    assert.equal(metadata.exports["./styles.css"], "./dist/chronolanejs.css");
    assert.equal(metadata.exports["./package.json"], "./package.json");
    assert.deepEqual(metadata.publishConfig, {
        access: "public",
        registry: "https://registry.npmjs.org/"
    });
    assert.deepEqual(metadata.sideEffects, ["**/*.css"]);
    assert.deepEqual(metadata.peerDependencies, {
        "@date-fns/tz": ">=1.5.0 <2",
        "date-fns": ">=4.1.0 <5",
        react: ">=18.2.0 <20",
        "react-dom": ">=18.2.0 <20"
    });
    assert.equal(metadata.engines.node, "^22.14.0 || ^24.10.0 || ^26.0.0");
    assert.deepEqual(metadata.files, [
        "assets/chronolane-logo.png",
        "assets/chronolane-logo.svg",
        "dist",
        "LICENSE",
        "README.md"
    ]);

    const topLevelFiles = (await readdir(installedPackage)).sort();
    assert.deepEqual(topLevelFiles, ["LICENSE", "README.md", "assets", "dist", "package.json"]);

    const bundle = await readFile(join(installedPackage, "dist/index.js"), "utf8");
    const declarations = await readFile(join(installedPackage, "dist/index.d.ts"), "utf8");
    const styles = await readFile(join(installedPackage, "dist/chronolanejs.css"), "utf8");
    assert.match(bundle, /^"use client";/);
    assert.match(declarations, /CalendarProps/);
    assert.match(declarations, /TimeGridViewProps/);
    assert.match(styles, /\.calendar/);
    assert.match(styles, /\.time-grid-view/);
};

const writeRuntimeProbe = async (
    fixtureRoot: string,
    expectedVersion: string
): Promise<void> => {
    await writeFile(join(fixtureRoot, "verify-installed.mjs"), `
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import Calendar, {
    DayView,
    loadCalendarLocale,
    parseCalendarDate
} from "@chronolanejs/react";

const metadata = JSON.parse(await readFile(
    new URL("./node_modules/@chronolanejs/react/package.json", import.meta.url),
    "utf8"
));
assert.equal(metadata.version, ${JSON.stringify(expectedVersion)});
assert.equal(typeof Calendar, "function");
assert.equal(typeof DayView, "function");
assert.equal(parseCalendarDate("2026-09-14").getDate(), 14);
assert.match(import.meta.resolve("@chronolanejs/react/styles.css"), /chronolanejs[.]css$/);

const locale = await loadCalendarLocale("en-GB");
assert.equal(locale.code, "en-GB");

const markup = renderToStaticMarkup(createElement(Calendar, {
    view: "day",
    date: "2026-09-14",
    events: [],
    showControls: false,
    viewProps: { minTime: "08:00", maxTime: "10:00" }
}));
assert.match(markup, /class="calendar"/);
assert.match(markup, /class="time-grid-view(?:\\s|")/);
`);
};

const verifyViteOutput = async (fixtureRoot: string): Promise<void> => {
    const assetsDirectory = join(fixtureRoot, "dist/assets");
    const javascript = await findFiles(assetsDirectory, ".js");
    const stylesheets = await findFiles(assetsDirectory, ".css");
    assert.ok(javascript.length > 0, "The Vite consumer must emit JavaScript");
    assert.ok(
        javascript.some((path) => /^en-GB-.*\.js$/.test(basename(path))),
        "The Vite consumer must preserve the lazy en-GB locale chunk"
    );
    assert.ok(stylesheets.length > 0, "The Vite consumer must emit package CSS");
    assert.match(await readFile(stylesheets[0]!, "utf8"), /\.time-grid-view/);
};

const verifyTreeShaking = async (fixtureRoot: string): Promise<void> => {
    await writeFile(join(fixtureRoot, "tree-shaking-entry.ts"), `
import { parseCalendarDate } from "@chronolanejs/react";

globalThis.__chronolaneTreeShakingProbe = parseCalendarDate("2026-09-14").getTime();
`);
    await writeFile(join(fixtureRoot, "vite.tree-shaking.config.mjs"), `
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        emptyOutDir: true,
        lib: {
            entry: resolve(import.meta.dirname, "tree-shaking-entry.ts"),
            fileName: "probe",
            formats: ["es"]
        },
        minify: false,
        outDir: "tree-shaking-dist"
    }
});
`);
    runNpm([
        "exec",
        "--",
        "vite",
        "build",
        "--config",
        "vite.tree-shaking.config.mjs"
    ], fixtureRoot);

    const outputFiles = await findFiles(join(fixtureRoot, "tree-shaking-dist"), ".js");
    assert.deepEqual(
        outputFiles.map((path) => basename(path)),
        ["probe.js"],
        "A named date-helper import must not retain locale chunks"
    );
    const output = await readFile(outputFiles[0]!, "utf8");
    assert.match(output, /chronolaneTreeShakingProbe/);
    assert.doesNotMatch(output, /time-grid-view|calendar-navigation|react\/jsx-runtime/);
};

const verifyNextOutput = async (fixtureRoot: string): Promise<void> => {
    const html = await readFile(join(fixtureRoot, ".next/server/app/index.html"), "utf8");
    assert.match(html, /class="calendar"/);
    assert.match(html, /class="time-grid-view(?:\s|")/);

    const stylesheets = await findFiles(join(fixtureRoot, ".next/static"), ".css");
    assert.ok(stylesheets.length > 0, "The Next.js consumer must emit package CSS");
    const css = await Promise.all(stylesheets.map((path) => readFile(path, "utf8")));
    assert.ok(
        css.some((contents) => contents.includes(".time-grid-view")),
        "The Next.js output must contain the package stylesheet"
    );
};

const temporaryRoot = await mkdtemp(join(tmpdir(), "chronolanejs-consumers-"));

try {
    const packOutput = captureNpm([
        "pack",
        packageSpec,
        "--ignore-scripts",
        "--json",
        "--pack-destination",
        temporaryRoot
    ], repositoryRoot);
    const packResults = JSON.parse(packOutput) as PackResult[];
    assert.equal(packResults.length, 1, "npm pack must produce exactly one artifact");
    const packedPackage = packResults[0]!;
    const tarballPath = resolve(temporaryRoot, packedPackage.filename);

    const consumersRoot = join(temporaryRoot, "consumers");
    const viteRoot = join(consumersRoot, "vite");
    const nextRoot = join(consumersRoot, "next");
    const ignoredDirectories = new Set([".next", "dist", "node_modules"]);
    const copyOptions = {
        recursive: true,
        filter: (source: string): boolean => !ignoredDirectories.has(basename(source))
    };
    await cp(join(repositoryRoot, "examples/vite"), viteRoot, copyOptions);
    await cp(join(repositoryRoot, "examples/next"), nextRoot, copyOptions);

    const vitePackage = await installTarball(viteRoot, tarballPath);
    await verifyInstalledPackage(vitePackage, packedPackage);
    await writeRuntimeProbe(viteRoot, packedPackage.version);
    run("node", ["verify-installed.mjs"], viteRoot);
    runNpm(["run", "build"], viteRoot);
    await verifyViteOutput(viteRoot);
    await verifyTreeShaking(viteRoot);

    const nextPackage = await installTarball(nextRoot, tarballPath);
    await verifyInstalledPackage(nextPackage, packedPackage);
    runNpm(["run", "build"], nextRoot);
    await verifyNextOutput(nextRoot);

    console.log(
        `\nVerified ${packedPackage.name}@${packedPackage.version} from one exact tarball `
        + "in clean Vite and Next.js consumers."
    );
} finally {
    await rm(temporaryRoot, { recursive: true, force: true });
}
