import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

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

const releaseWorkflow = await readFile(
    new URL("../.github/workflows/publish.yml", import.meta.url),
    "utf8"
);
const publishCommand = "npm exec -- semantic-release";
const publishIndex = releaseWorkflow.indexOf(publishCommand);
const requiredValidationCommands = [
    "npm audit signatures",
    "npm run check",
    "npm run examples:check",
    "npx playwright install --with-deps chromium firefox",
    "npm run check:storybook"
];

assert.match(
    releaseWorkflow,
    /if: vars\.NPM_RELEASES_ENABLED == 'true' && github\.ref == 'refs\/heads\/main'/,
    "Publication must require the explicit release variable on main"
);
assert.match(
    releaseWorkflow,
    /id-token: write/,
    "Trusted npm publishing requires the workflow's OIDC permission"
);
assert.ok(publishIndex >= 0, "The release workflow must invoke semantic-release");
assert.doesNotMatch(
    releaseWorkflow,
    /continue-on-error:\s*true/,
    "Release validation steps must stop the job when they fail"
);

for (const validationCommand of requiredValidationCommands) {
    const validationIndex = releaseWorkflow.indexOf(validationCommand);
    assert.ok(
        validationIndex >= 0 && validationIndex < publishIndex,
        `${validationCommand} must pass before semantic-release may publish`
    );
}
