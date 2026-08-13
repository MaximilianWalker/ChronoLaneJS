# Contributing to ChronoLaneJS

ChronoLaneJS welcomes focused bug fixes, tests, documentation improvements, and
features that keep the calendar application-independent.

## Development

```bash
npm install
npm run check
npm run check:storybook
```

Keep pure date and layout behavior outside React components, add tests for
behavioral changes, and avoid application-specific dependencies or styling.
Use PascalCase filenames for React components and camelCase filenames for
hooks, pure modules, scripts, and tests. Keep private component names scoped to
their feature, and reserve domain prefixes for public or cross-feature symbols.
Shared types belong in `src/types.ts`; feature types stay beside their feature.
Declarations are emitted from source, so do not maintain a separate declaration
file.

Document exported functions and components, plus non-obvious private helpers,
with TSDoc comments (`/** ... */`). Describe observable contracts and important
semantics rather than restating the implementation. Use `@remarks` for behavior
that needs context and add `@param`, `@returns`, and `@throws` when they clarify
the contract. These comments are emitted into the package declarations. Do not
add isolated comments to individual props, expressions, or obvious branches.
Comments must either document a public contract systematically or explain a
non-obvious invariant or constraint; otherwise, prefer clear code with no
comment.

Add or update a story for every visible component behavior or public
customization point. Keep story fixtures synthetic and deterministic, exercise
important interactions with a `play` function, and fix accessibility failures
rather than disabling the global checks. Run `npm run storybook` for interactive
development, `npm run storybook:test` for the Chromium and Firefox suites, and
`npm run storybook:build` to verify the deployable catalog.

The GitHub Pages website renders `README.md`, `CONTRIBUTING.md`, `ROADMAP.md`,
`SECURITY.md`, and every file under `docs/` directly, so update the canonical
Markdown instead of adding site-only documentation. Public exports and props
must be present in `docs/api.md`; `npm run docs:check` enforces that coverage.
Runnable Vite and Next.js integrations live under `examples/` and are validated
with `npm run examples:check`. Run `npm run site` to preview the website and
compact playground, or `npm run site:build` to verify its production output.

Open an issue before starting a breaking API or architectural change so the
contract can be agreed before implementation.

## Component boundaries

A React component must represent a meaningful UI or behavior boundary. It
should own at least one cohesive responsibility, such as reusable markup,
independent state or lifecycle behavior, a performance boundary, or a public
renderer extension point.

Do not extract JSX into a second component merely to shorten a file. In
particular, do not create a same-file child that receives a long list of values
already owned by its parent and only forwards them into markup. That adds a
private API without reducing coupling. Keep the render body in the owner, or
first create a cohesive model or hook that materially shrinks the boundary.

Before extracting a component, verify that:

- its purpose can be described without referring to the parent file;
- its inputs form a small, cohesive contract rather than mirroring parent
  props and local variables;
- it is independently reusable, testable, stateful, or performance-relevant;
- removing the boundary would lose a concrete architectural benefit.

Pure calculations should live in focused domain modules when independently
testable. Default renderer components may remain separate because they are
real replacement points in the public API.

## Roadmap discipline

`ROADMAP.md` is the canonical backlog. Reference its stable item identifier in
related issues and pull requests. A change that completes, adds, removes, or
materially changes planned work must update the roadmap in the same pull
request. Mark an item complete only after its code, public types, tests,
stories, and documentation satisfy the listed completion criteria.

## Publishing

`@chronolanejs/react` is configured for publication as a public package in the
`@chronolanejs` npm organization. `dev` is the default development branch and
accepts direct updates. `main` is the protected release branch. Promote a
tested development state with a pull request from `dev` to `main` and merge it
with a merge commit so both branches retain shared ancestry.

Semantic-release derives the next version and GitHub release notes from every
commit since the previous `v<version>` tag. The promotion pull request title is
used as its merge commit title and must use Conventional Commit syntax:

- `fix:` publishes a patch;
- `perf:` publishes a patch;
- `feat:` publishes a minor;
- `feat!:` or `fix!:` in the promotion title, or a `BREAKING CHANGE:` footer
  in an included commit, publishes a breaking release.

Breaking changes publish a major version, including before `1.0.0`.
Documentation, test, build, refactor, style, and chore commits do not publish a
version by themselves. Keep those changes on `dev` until a release-bearing
promotion rather than opening a documentation-only pull request to `main`.

After a promotion is merged, the Release workflow validates the exact `main`
commit before semantic-release selects the version, temporarily updates the
package metadata in the runner, publishes the package under npm's `latest`
distribution tag, creates the `v<version>` tag, and creates the GitHub release.
Git tags and the npm registry are the canonical version history;
semantic-release does not commit generated version changes back to the
repository.

The workflow is deliberately inactive until the repository variable
`NPM_RELEASES_ENABLED` equals `true`. After every remaining P0 gate passes:

1. Promote this inactive release automation to `main` while
   `NPM_RELEASES_ENABLED` remains unset.
2. Enable two-factor authentication for the `maximilianwalker` npm account.
3. Publish `0.1.0-rc.0` manually with the npm `next` tag to create the package.
4. Create the matching `v0.1.0-rc.0` GitHub prerelease from the published
   commit.
5. Register the trusted publisher described below on the npm package.
6. Require two-factor authentication and disallow token-based publication in
   the package settings.
7. Set `NPM_RELEASES_ENABLED=true` in the GitHub repository variables.
8. Merge a release-bearing `dev` to `main` promotion. A `fix:` or `feat:`
   promotion after the bootstrap prerelease publishes stable `0.1.0`.

Do not add an npm access token to the repository or workflow. Semantic-release
publishes through npm trusted publishing with the workflow's short-lived OIDC
identity.

The npm trusted publisher must match these values exactly:

- GitHub organization or user: `MaximilianWalker`
- repository: `ChronoLaneJS`
- workflow: `publish.yml`
- environment: none
- allowed action: `npm publish`

The workflow runs on a GitHub-hosted runner with narrowly scoped OIDC
permission, pinned actions, and a pinned npm version that supports trusted
publishing. `package.json` owns the public access and registry settings so
local package metadata and CI cannot disagree. Trusted publishing generates
provenance for the public package automatically.
