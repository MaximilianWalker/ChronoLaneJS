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
the contract. These comments are emitted into the package declarations.

Add or update a story for every visible component behavior or public
customization point. Keep story fixtures synthetic and deterministic, exercise
important interactions with a `play` function, and fix accessibility failures
rather than disabling the global checks. Run `npm run storybook` for interactive
development, `npm run storybook:test` for the Chromium suite, and
`npm run storybook:build` to verify the deployable catalog.

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
