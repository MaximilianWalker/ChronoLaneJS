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
hooks, pure modules, scripts, and tests. Public types belong in `src/types.ts`
and are emitted from source; do not maintain a separate declaration file.

Open an issue before starting a breaking API or architectural change so the
contract can be agreed before implementation.
