# Changelog

All notable consumer-facing changes to ChronoLaneJS are documented here.
ChronoLaneJS is an open-source React and TypeScript calendar and scheduler.

The project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Git tags and npm are the canonical version record; this file provides the
curated upgrade context that accompanies the automatically generated GitHub
release notes.

## [Unreleased]

### Documentation

- Added focused, illustrated guides for event movement and resizing, resource
  scheduling, time zones and localization, custom renderers, accessibility,
  and Vite and Next.js integration.
- Aligned the website, repository, package manifest, and release description on
  the open-source React and TypeScript calendar and scheduler category.

## [2.0.0] - 2026-08-24

See [Migrating from v1 to v2](./docs/migrations/v2.md) before upgrading.

### Breaking changes

- Replaced the ambiguous event-editing contract with stable selection and
  opening semantics. `canEditEvent` is now `canOpenEvent`, and `onEventEdit` is
  now `onEventOpen`. Selection uses click or Space; opening uses double-click,
  double-tap, or Enter.
- Added rendered-occurrence context to event predicates and semantic callbacks.
  Applications can now distinguish the visible view, day, and resource without
  receiving a clipped event in place of the source event.
- Expanded the required `CalendarMessages` registry with
  `multiDayRegionLabel`, `eventMoveHandle`, `eventMoveTarget`, and
  `eventResizeHandle`.
- Renamed `TimeGridEventDropPosition` to `TimeGridEventPosition` so movement
  and resizing share one position contract.
- Added the required `layout` discriminator to `TimeGridEventSegment`. Custom
  time-grid event renderers can distinguish timed and dedicated multi-day
  occurrences.

### Added

- Pointer, touch, and keyboard event movement from the event surface, with live
  previews, explicit source/destination positions, cancellation, and accessible
  announcements.
- Pointer, touch, and keyboard event resizing with independent `resizeStep`
  precision, live geometry, per-edge permission checks, and clear edge
  affordances.
- An opt-in dedicated multi-day event region through
  `multiDayEventLayout="dedicated"`.
- Arrow, Home, End, Page Up, and Page Down traversal for selectable time-grid
  slots.
- Additive raw event-root callbacks through `eventInteractions`, including
  shortcut metadata composition.
- Event detail tooltips and ellipsis handling for content that does not fit its
  rendered event surface.
- Focused Storybook interaction sections for selection/opening, movement,
  resizing, slot selection, keyboard navigation, and customization.

### Changed

- `WeekView` columns now remain fluid down to a `96px` minimum before scrolling
  horizontally. Set `slotSizing={{ minWidth: 0 }}` to keep fully compressible
  columns.
- Dedicated multi-day movement and resizing use whole calendar-day steps while
  preserving wall-clock fields across daylight-saving transitions.
- Time-grid, month, and agenda ownership was simplified so collection owners
  map their own structural elements and renderers without pass-through
  component or hook abstractions.
- Event movement uses the event body instead of a permanent move button;
  resize hit zones remain visually hidden until hovered, focused, or active.

### Fixed

- Preserved source-event identity and full duration across clipped, overnight,
  duplicate, multi-resource, moved, and resized occurrences.
- Kept time-axis labels and interaction proposals stable across daylight-saving
  transitions.
- Kept week columns readable in narrow containers.
- Aligned event, slot, and resize-handle keyboard focus visuals with hover and
  active interaction styling.
- Updated stylesheet consumers after simplifying the shared navigation
  component name.

## [1.0.1] - 2026-08-16

### Fixed

- Polished the GitHub Pages presentation and documentation routing.

## [1.0.0] - 2026-08-16

### Added

- First stable release of the typed React calendar package.
- View-specific `Calendar` props, direct built-in views, resource grouping,
  range-owned navigation, localization registries, renderer contracts, and
  controlled selection APIs.
- Bundled production styles, a GitHub Pages playground, Storybook scenarios,
  exhaustive API documentation, consumer-build verification, and automated
  trusted publishing.

### Changed

- Established the stable public API from the release-candidate series,
  including strict time-grid scale and slot-sizing contracts.

## [0.1.0-rc.0] - 2026-08-16

### Added

- First public release candidate of ChronoLaneJS under npm's `next` tag.

[Unreleased]: https://github.com/MaximilianWalker/ChronoLaneJS/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/MaximilianWalker/ChronoLaneJS/compare/v1.0.1...v2.0.0
[1.0.1]: https://github.com/MaximilianWalker/ChronoLaneJS/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/MaximilianWalker/ChronoLaneJS/releases/tag/v1.0.0
[0.1.0-rc.0]: https://github.com/MaximilianWalker/ChronoLaneJS/releases/tag/v0.1.0-rc.0
