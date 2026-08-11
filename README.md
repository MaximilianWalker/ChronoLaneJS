# ChronoLaneJS

A composable, timezone-aware calendar toolkit for React.

ChronoLaneJS provides day, week, month, agenda, resource, and configurable
time-grid views without imposing application state, a design system, or a data
backend. Every major renderer can be replaced while the date, range, locale,
resource, and overlap behavior remains reusable.

> ChronoLaneJS is pre-1.0. Its public API is usable, but breaking changes may be
> made while the package is being extracted and documented.

All known correctness work, API improvements, release gates, and remaining
library tasks are tracked in the [roadmap](ROADMAP.md).

## Features

- Day, week, month, agenda, resource, and arbitrary time-grid ranges.
- IANA timezone support through `@date-fns/tz`.
- Lazy, cached date-fns locales resolved from BCP 47-style names.
- Multi-day event clipping and overlapping-event lane layout.
- Optional event selection, editing, and drag-and-drop callbacks.
- Custom event, slot, header, background-event, navigation, and empty renderers.
- Controlled and uncontrolled navigation.
- Application-independent CSS with custom-property extension points.
- TypeScript-first ESM package with React 18 and 19 support.
- Public declarations generated from the implementation during every build.

## Installation

```bash
npm install @chronolanejs/react react react-dom date-fns @date-fns/tz
```

Import the package stylesheet once in your application:

```ts
import "@chronolanejs/react/styles.css";
```

## Quick start

```tsx
import Calendar from "@chronolanejs/react";
import "@chronolanejs/react/styles.css";

const events = [
    {
        id: "planning",
        title: "Planning",
        start: new Date(2026, 8, 1, 9),
        end: new Date(2026, 8, 1, 10, 30),
        color: "#2563eb"
    }
];

export default function Schedule() {
    return (
        <Calendar
            view="week"
            events={events}
            locale="en-US"
            timeZone="Europe/Lisbon"
        />
    );
}
```

ChronoLaneJS's package entry is marked as a client module and can be imported
from a Next.js client component without a framework-specific wrapper.

## Interactive examples

The [ChronoLaneJS Storybook](https://maximilianwalker.github.io/ChronoLaneJS/)
documents every built-in view and its public customization points. It includes
fixed examples for event overlap, overnight and multi-day events, resources,
background events, custom ranges and renderers, locale and timezone changes,
daylight-saving transitions, responsive layouts, and user interactions.

Use the Storybook toolbar to change the locale, IANA timezone, and viewport.
Each story is also an executable browser test; interaction stories assert their
callbacks and every story is checked automatically for accessibility issues.

## Built-in views

| Name | Purpose |
| --- | --- |
| `day` | One-day time-grid preset |
| `week` | Seven-day time-grid preset |
| `month` | Month grid including optional outside days |
| `agenda` | Event groups across a configurable date range |
| `resource` | One-day time-grid preset with resource columns |
| `time-grid` | Generic configurable time-grid renderer |

`day`, `week`, and `resource` are presets over `TimeGridView`; they do not
duplicate its layout or interaction logic.

## Ranges

Time-grid and agenda ranges accept:

- `"day"` or `"week"`;
- a positive number of consecutive days;
- an array of visible dates;
- `{ start, end }` or `{ start, days }`;
- a callback returning any supported definition.

```tsx
import { startOfWeek } from "date-fns";

<Calendar
    view="time-grid"
    range={{
        start: (anchor) => startOfWeek(anchor, { weekStartsOn: 1 }),
        days: 7,
        includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5,
        navigationStep: 7
    }}
/>
```

Non-contiguous ranges are supported, so business calendars do not require a
dedicated work-week view.

## Locales and timezones

`locale` accepts either a supported locale name or a date-fns locale object.
`en-US` is the synchronous default. Other named locales are loaded lazily and
cached:

```tsx
<Calendar locale="pt-PT" timeZone="Europe/Lisbon" />
```

Use `preloadCalendarLocale(name)` when a locale should be ready before render.
An explicit `weekStart` overrides the locale convention.

Locales format dates and provide calendar conventions. They do not translate
application labels such as navigation or empty-state text; those remain
caller-controlled.

## Resources

Resources are arbitrary values rather than a room-specific abstraction:

```tsx
<Calendar
    view="resource"
    resources={people}
    events={events}
    getResourceId={(person) => person.uuid}
    getResourceTitle={(person) => person.displayName}
    getEventResourceIds={(event) => event.assigneeUuids}
/>
```

The defaults read `resource.id` and `event.resourceId`, `event.resourceIds`, or
`event.resource.id`.

## Renderer extension points

Views accept component overrides where applicable:

- `navigationButton`
- `eventComponent`
- `slotComponent`
- `backgroundEventComponent`
- `columnHeaderComponent`
- `dayHeaderComponent`
- `emptyComponent`

Custom renderers receive the normalized calendar value plus the semantic and
interaction props required by that view. ChronoLaneJS owns layout and behavior;
the renderer owns markup and presentation.

## Interactions

Selection and editing callbacks receive the normalized source event, never a
clipped time-grid segment. Time-grid event renderers receive that source as
`event` and the visible positioned portion as `segment`.

Providing `onEventEdit` enables editing, and providing `onEventDrop` enables
dragging. Use `canEditEvent(event)` or `canDragEvent(event, segment)` only when
individual events or visible resource segments need to be restricted.

Time slots remain selectable and valid drop targets when grid lines are hidden
with `showGridLines={false}`. Grid-line visibility is presentational and does
not control the slot interaction layer.

`onEventDrop` receives the source event, its proposed `start` and `end`, and
explicit `source` and `destination` positions. Each position contains its day
and concrete resource value, or `null` when the grid has no resources. Dropping
a clipped multi-day event preserves the source event's complete duration.

## Custom views

Extend or replace the view registry with the `views` prop:

```tsx
<Calendar
    view="quarter"
    views={{
        quarter: {
            component: QuarterView,
            defaultProps: { months: 3 }
        }
    }}
    viewProps={{ compact: true }}
/>
```

A custom view receives events, background events, the active view name,
shared calendar props, its registered defaults, and `viewProps`.

## Public exports

ChronoLaneJS exports `Calendar` as the default plus:

- `AgendaView`, `DayView`, `MonthView`, `ResourceView`, `TimeGridView`, and
  `WeekView`;
- `defaultCalendarViews`;
- date parsing and timezone helpers;
- range construction and navigation helpers;
- locale discovery, loading, and preloading helpers.

Time-grid layout internals and default renderer implementations are private so
they can evolve without expanding the package compatibility surface.

Public functions and components include TSDoc in the generated declarations,
so their behavior, parameters, return values, and failure conditions are
available through TypeScript-aware editors.

## Architecture

```text
src/
|-- Calendar.tsx           Public calendar component
|-- types.ts               Contracts shared across features
|-- core/                  Pure date, event, locale, and range behavior
|-- hooks/                 Shared React state
|-- components/            Components shared across views
`-- views/
    |-- agenda/            View, private renderers, and feature types
    |-- month/             View, private renderers, and feature types
    `-- time-grid/
        |-- TimeGridView.tsx
        |-- Event.tsx
        |-- Slot.tsx
        |-- ColumnHeader.tsx
        |-- Background.tsx
        |-- drop.ts
        |-- resources.ts
        |-- types.ts
        |-- layout/        Scale, event placement, and orchestration
        `-- presets/       Day, week, and resource public views
```

Views may depend on shared components, hooks, and core modules. Shared modules
never depend on a view, and one view never imports another view's internals.

Public and cross-feature components retain explicit domain names such as
`TimeGridView.tsx`. Private components rely on their feature directory and use
concise role names such as `Event.tsx` and `Slot.tsx`. Hooks and pure modules
use camelCase, and component styles use the same basename as their owner.
Feature-specific types stay with their feature and are re-exported from the
package entry.

## Development

```bash
npm install
npm run check
npm run check:storybook
npm pack --dry-run
```

Run the interactive component catalog locally:

```bash
npm run storybook
```

`npm run storybook:test` executes every story in Chromium, while
`npm run storybook:build` produces the static site in `storybook-static/`.
GitHub Actions validates the package and Storybook separately, then publishes
the static catalog to GitHub Pages from `main`.

Regenerate the locale registry after changing date-fns versions:

```bash
npm run locales:generate
npm run locales:check
```

The release workflow publishes GitHub releases through npm trusted publishing.
The npm package must be configured with this repository as a trusted publisher
before the first release.

## License

[MIT](LICENSE)
