# ChronoLaneJS documentation

This directory is the canonical consumer documentation for ChronoLaneJS. Every
page is readable directly on GitHub and is rendered from the same Markdown on
the [project documentation site](https://maximilianwalker.github.io/ChronoLaneJS/docs/).

## Start here

| Guide | Use it when |
| --- | --- |
| [Getting started](./getting-started.md) | Installing the package, modeling events, choosing a view, or connecting state |
| [API reference](./api.md) | Looking up any exported component, prop, callback, renderer payload, type, function, default, or error |
| [Styling and theming](./styling.md) | Applying dimensions, CSS variables, class hooks, responsive behavior, or custom renderers |
| [Examples](./examples.md) | Building Vite and Next.js integrations, controlled navigation, resources, localization, renderers, or interactions |
| [Accessibility](./accessibility.md) | Understanding keyboard behavior, focus, labels, drag limitations, and renderer responsibilities |
| [Migrating from v1 to v2](./migrations/v2.md) | Upgrading through the v2 event interaction, message, position, renderer, and sizing changes |
| [Changelog](../CHANGELOG.md) | Reviewing curated changes and upgrade context for every published version |

## Documentation contract

- The package root, direct views, events, resources, ranges, localization,
  renderers, and callbacks are documented with concrete data examples.
- The [API reference](./api.md) is exhaustive for the public exports in
  `src/index.ts`. Its coverage is checked by `npm run docs:check`.
- Defaults and thrown errors describe the current implementation, not intended
  future behavior.
- Examples use only the current public API and are type-checked and
  production-built by `npm run examples:check`.
- Styling documentation distinguishes stable consumer hooks from internal
  layout implementation.
- Accessibility documentation states both supported behavior and known gaps;
  it does not imply that open roadmap work is complete.
- Every major release has a versioned migration guide that covers all public
  contract breaks with before-and-after examples.
- The root changelog records curated consumer-visible changes; Git tags and npm
  remain the canonical version history.

## Project documentation

- [Repository overview](../README.md)
- [Development guide](../DEVELOPMENT.md)
- [Roadmap](../ROADMAP.md)
- [Security policy](../SECURITY.md)
- [Changelog](../CHANGELOG.md)
- [Storybook](https://maximilianwalker.github.io/ChronoLaneJS/storybook/)
