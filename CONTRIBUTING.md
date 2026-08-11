# Contributing to ChronoLane

ChronoLane welcomes focused bug fixes, tests, documentation improvements, and
features that keep the calendar application-independent.

## Development

```bash
npm install
npm run check
```

Keep pure date and layout behavior outside React components, add tests for
behavioral changes, and avoid application-specific dependencies or styling.
Use PascalCase filenames for React components and camelCase filenames for
hooks, pure modules, scripts, and tests. Keep private component names scoped to
their feature, and reserve domain prefixes for public or cross-feature symbols.
Shared types belong in `src/types.ts`; feature types stay beside their feature.
Declarations are emitted from source, so do not maintain a separate declaration
file.

Open an issue before starting a breaking API or architectural change so the
contract can be agreed before implementation.
