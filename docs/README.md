# Documentation

ChronoLaneJS is an open-source React and TypeScript calendar and scheduler.
Use these guides to integrate it, understand its public contracts, and
customize calendar behavior without depending on implementation details. The
same canonical Markdown is available on GitHub and on the
[documentation site](https://maximilianwalker.github.io/ChronoLaneJS/docs/).

## Start building

Follow [Getting started](./getting-started.md) to install the package, model
events, choose a view, and connect state. Use
[Vite and Next.js](./framework-integration.md) for complete framework
integrations.

## Build a scheduling capability

- [Drag and resize events](./interactions.md) covers controlled pointer, touch,
  and keyboard event updates.
- [Resource scheduling](./resources.md) models rooms, people, equipment,
  grouping, assignments, and resource-aware movement.
- [Time zones and locales](./time-zones.md) distinguishes wall-clock values
  from absolute timestamps and covers IANA zones, DST, locale loading, and
  messages.
- [Custom renderers](./renderers.md) replaces event, slot, header, navigation,
  month, and agenda markup while retaining library behavior.
- [Styling and theming](./styling.md) covers dimensions, CSS variables, stable
  class hooks, and responsive behavior.
- [Accessibility](./accessibility.md) defines keyboard, focus, naming,
  interaction, custom-renderer, and consumer testing responsibilities.

## Look up a contract

The [TypeScript API](./api.md) documents every exported component, prop,
callback, renderer payload, type, function, default, and thrown error.

## Upgrade and release history

Use [Upgrade to v2](./migrations/v2.md) for breaking event interaction,
message, position, renderer, and sizing changes. The
[changelog](../CHANGELOG.md) records consumer-visible changes for every
published version.

## Project resources

- [About ChronoLaneJS](../README.md)
- [Roadmap](../ROADMAP.md)
- [Security](../SECURITY.md)
- [Storybook](https://maximilianwalker.github.io/ChronoLaneJS/storybook/)
