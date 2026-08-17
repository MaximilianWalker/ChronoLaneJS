# ChronoLaneJS development guide

This guide defines the coding, documentation, validation, and release standards
for repository development.

## Development

The requirements below apply to every repository change.

```bash
npm install
npm run check
npm run examples:check
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

The GitHub Pages website renders `README.md`, `DEVELOPMENT.md`, `ROADMAP.md`,
`SECURITY.md`, and every file under `docs/` directly, so update the canonical
Markdown instead of adding site-only documentation. Public exports and props
must be present in `docs/api.md`; `npm run docs:check` rejects both missing and
stale export or prop entries. The built package runtime is also checked against
an exact export allowlist so implementation helpers cannot appear silently.
Runnable Vite and Next.js integrations live under `examples/` as independent
consumer packages. `npm run check` validates the publishable root package;
`npm run examples:check` packs one artifact, installs that exact tarball into
temporary clean copies of both consumers, verifies the public package boundary,
and production-builds both applications. Run
`npm run site` to preview the website and compact playground, or
`npm run site:build` to verify its production output.

The generated declaration contract is committed as
`etc/chronolanejs.api.md`. After an intentional public type or signature
change, run `npm run api:report` and review the report diff. `npm run api:check`
regenerates declarations without accepting changes and fails when the committed
report has drifted; the complete `npm run check` workflow includes this gate.
The report is generated output and must not be edited by hand.

Document and agree the contract before starting a breaking API or architectural
change so the implementation has an explicit decision record.

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

Every pull request is validated by the complete CI matrix, and `main` requires
every CI job to pass on the current branch tip before it can be merged. Each
merge to `main` triggers a second validation of the exact merge commit and a
GitHub Pages deployment. When pushes overlap, Pages cancels the superseded run
so the published site converges on the latest `main` commit. The gated Release
workflow runs from the same push, but publishes to npm only when releases are
enabled and semantic-release finds a release-bearing Conventional Commit.

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

The release bootstrap is complete. `0.1.0-rc.0` was published manually under
the `next` tag with a matching GitHub prerelease, the trusted publisher was
registered, and `NPM_RELEASES_ENABLED=true` enabled automatic releases. The
first release-bearing promotion contained breaking commits, so
semantic-release correctly selected `1.0.0`; subsequent qualifying promotions
continue from the published Git tags.

`npm run release:verify` checks that the workflow stays restricted to enabled
`main` releases, retains OIDC permission, and runs every validation command
before semantic-release. The workflow uses the default fail-closed step
behavior, so any failed validation prevents the publication step.

## Dependency maintenance

Dependabot checks the root package, both locked consumer examples, and pinned
GitHub Actions every Monday. Routine minor and patch updates are grouped by
ecosystem. Major updates remain individual pull requests and require explicit
compatibility review, including security fixes that cross a major version;
they must not be folded into an update group.

All Dependabot pull requests target the default `dev` branch and run the full
pull-request CI matrix, including supported Node/React combinations, both
consumer builds, browser stories, and the package checks. Dependabot security
updates are enabled and grouped separately from scheduled version updates. Do
not merge an automated update with failing checks or unresolved compatibility
questions.

Do not add an npm access token to the repository or workflow. Semantic-release
publishes through npm trusted publishing with the workflow's short-lived OIDC
identity.

### Security releases

The normal `dev`-to-`main` promotion path must not expose a confirmed
vulnerability before a patched package is ready. Follow `SECURITY.md`: develop
the remediation in the draft advisory's temporary private fork, validate it
locally because CI cannot access that fork, and use the advisory merge control
to land a release-bearing `fix:` commit based on `main`. Coordinate the gated
npm release with publication of the advisory, then merge `main` back into
`dev` immediately. Do not copy confidential advisory details into public
branches, pull requests, workflow logs, or issues before the coordinated
disclosure.

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
