# TypeScript API reference

This reference documents every public export from `@chronolanejs/react`.
All examples import from the package root; import the bundled CSS separately
from `@chronolanejs/react/styles.css`.

## Reference map

- [Calendar and views](./api/calendar-and-views.md) covers `Calendar`, shared
  props, built-in views, navigation boundaries, and custom view registration.
- [Events, resources, and ranges](./api/events-resources-ranges.md) covers event
  inputs, resource configuration, selections, and visible-range contracts.
- [Interactions and callbacks](./api/interactions-callbacks.md) covers
  occurrence data and time-grid movement and resize payloads.
- [Renderer contracts](./api/renderer-contracts.md) covers every built-in
  renderer extension point and its exact props.
- [Localization and utilities](./api/localization-utilities.md) covers locales,
  formatters, messages, date and range helpers, and public errors.

## Component map

| Export | Purpose | Props |
| --- | --- | --- |
| default `Calendar` | Type-safe root that selects a registered view | `CalendarProps` |
| `AgendaView` | Direct agenda list | `AgendaViewProps` |
| `MonthView` | Direct month grid | `MonthViewProps` |
| `DayView` | One-day `TimeGridView` preset | `TimeGridViewProps` |
| `WeekView` | Seven-day `TimeGridView` preset | `TimeGridViewProps` |
| `TimeGridView` | Direct configurable time grid | `TimeGridViewProps` |
