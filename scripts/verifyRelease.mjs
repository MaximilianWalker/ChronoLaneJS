import assert from "node:assert/strict";

import { analyzeCommits } from "@semantic-release/commit-analyzer";

import config from "../release.config.mjs";

const analyzer = config.plugins.find(
    plugin => Array.isArray(plugin) && plugin[0] === "@semantic-release/commit-analyzer"
);

assert.ok(analyzer, "The semantic-release commit analyzer must be configured");
assert.deepEqual(config.branches, ["main"], "Only main may publish releases");
assert.equal(config.tagFormat, "v${version}", "Release tags must use v<version>");

const cases = [
    ["fix: correct behavior", "patch"],
    ["perf: reduce layout work", "patch"],
    ["feat: add renderer", "minor"],
    ["feat!: replace public API", "major"],
    ["fix: replace callback\n\nBREAKING CHANGE: callback arguments changed", "major"],
    ["docs: clarify usage", null]
];
const logger = { log: () => undefined };

for (const [message, expected] of cases) {
    const actual = await analyzeCommits(
        analyzer[1],
        { commits: [{ message }], logger }
    );

    assert.equal(actual, expected, `Unexpected release type for ${message}`);
}
