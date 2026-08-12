<p align="center">
  <img src="./assets/chronolane-logo.svg" width="176" alt="ChronoLaneJS logo" />
</p>

<h1 align="center">ChronoLaneJS</h1>

<p align="center">
  <strong>A modern, timezone-aware calendar for React.</strong>
</p>

<p align="center">
  Day, week, month, agenda, resource, and custom time-grid views<br />
  with flexible rendering and controlled or uncontrolled state.
</p>

<p align="center">
  <a href="https://github.com/MaximilianWalker/ChronoLaneJS/actions/workflows/ci.yml"><img src="https://github.com/MaximilianWalker/ChronoLaneJS/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI status" /></a>
  <a href="https://maximilianwalker.github.io/ChronoLaneJS/storybook/"><img src="https://img.shields.io/badge/Storybook-live-ff4785?logo=storybook&logoColor=white" alt="Live Storybook" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/MaximilianWalker/ChronoLaneJS" alt="MIT license" /></a>
  <img src="https://img.shields.io/badge/React-18%20%7C%2019-149eca?logo=react&logoColor=white" alt="React 18 and 19" />
</p>

<p align="center">
  <a href="https://maximilianwalker.github.io/ChronoLaneJS/">Live demo</a>
  &middot;
  <a href="#quick-start">Quick start</a>
  &middot;
  <a href="#core-concepts">Core concepts</a>
  &middot;
  <a href="./ROADMAP.md">Roadmap</a>
  &middot;
  <a href="./CONTRIBUTING.md">Contributing</a>
</p>

---

ChronoLaneJS is a customizable React calendar with day, week, month, agenda,
resource, and custom time-grid views. It provides timezone-aware date handling,
range navigation, event layout, interactions, and accessible defaults while
keeping state management and persistence outside the component.

> [!IMPORTANT]
> ChronoLaneJS is pre-1.0, and `@chronolanejs/react` has not been published to
> npm yet. The public API is usable through the repository and Storybook, but
> breaking changes may be made before the first stable release. Release gates
> and remaining work are tracked in the [roadmap](./ROADMAP.md).

## Why ChronoLaneJS?

- **Views that share one model:** day, week, month, agenda, resource, and
  arbitrary time-grid ranges use the same event and navigation contracts.
- **Correct across time:** IANA timezones, daylight-saving transitions, lazy
  date-fns locales, and explicit week-start behavior are built in.
- **Flexible layout:** overlapping events, clipped multi-day events,
  background events, resources, and non-contiguous ranges are first-class.
- **Flexible integration:** controlled or uncontrolled navigation,
  selection, editing, and drag-and-drop integrate with your state layer.
- **Customizable presentation:** override the meaningful render boundaries or
  style the defaults without inheriting a design system.
- **Typed and tested:** the ESM package emits declarations from source, and
  every Storybook example runs as a browser and accessibility test.

## Interactive documentation

The [project website](https://maximilianwalker.github.io/ChronoLaneJS/) includes
a compact playground with every built-in view. The exhaustive
[Storybook](https://maximilianwalker.github.io/ChronoLaneJS/storybook/) covers
every public customization point, including:

- event overlap, overnight events, and multi-day clipping;
- resources, background events, and custom ranges;
- custom renderers and view registration;
- locale, timezone, and daylight-saving transitions;
- responsive layouts, selection, editing, and drag-and-drop.

Use Storybook's toolbar to change the locale, IANA timezone, and viewport. The
website and full catalog are rebuilt and deployed together from `main`.

## Installation

The first public release will install as:

```bash
npm install @chronolanejs/react react react-dom date-fns @date-fns/tz
```

Import the package stylesheet once at your application entry point:

```ts
import "@chronolanejs/react/styles.css";
```

Until the npm release, clone the repository and run Storybook to evaluate the
library locally:

```bash
git clone https://github.com/MaximilianWalker/ChronoLaneJS.git
cd ChronoLaneJS
npm ci
npm run storybook
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

ChronoLaneJS is marked as a client module and can be imported directly from a
Next.js client component without a framework-specific wrapper.

## Core concepts

### Views

| View | Purpose |
| --- | --- |
| `day` | One-day time-grid preset |
| `week` | Seven-day time-grid preset |
| `month` | Month grid with optional outside days |
| `agenda` | Event groups across a configurable date range |
| `resource` | One-day time grid with resource columns |
| `time-grid` | Generic, configurable time-grid renderer |

`day`, `week`, and `resource` are presets over `TimeGridView`; they share its
layout and interaction behavior rather than maintaining separate engines.

The root `Calendar` props are a discriminated TypeScript union keyed by
`view`. Each built-in name accepts only the props supported by that view, and
omitting `view` selects the `week` contract. Misspelled props and combinations
such as time-grid scale options on a month view fail compilation.

### Ranges

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

Non-contiguous ranges are supported, so business calendars do not need a
dedicated work-week view.

### Time-grid scale

Time-grid views keep the visible wall-clock range separate from selection and
label cadence:

```tsx
<Calendar
    view="week"
    minTime="08:00"
    maxTime="18:00"
    slotDuration={30}
    labelInterval={60}
/>
```

`minTime` is inclusive and `maxTime` is exclusive. Both use strict,
zero-padded `HH:mm` values; `maxTime` also accepts `24:00`. `slotDuration`
controls selectable granularity, while `labelInterval` controls time labels
and major dividers. Invalid or reversed configurations throw rather than being
silently adjusted.

### Locales and timezones

`locale` accepts a supported locale name or a date-fns locale object. `en-US`
is the synchronous default; other named locales are loaded lazily and cached.

```tsx
<Calendar locale="pt-PT" timeZone="Europe/Lisbon" />
```

Call `preloadCalendarLocale(name)` when a locale should be available before
render. An explicit `weekStart` overrides the locale convention.

Locales format dates and supply calendar conventions. Application labels such
as navigation and empty-state text remain caller-controlled through
`messages`.

### Resources

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

## Customization

### Renderers

Views expose intentional renderer boundaries where applicable:

- `navigationButton`
- `eventComponent`
- `slotComponent`
- `backgroundEventComponent`
- `columnHeaderComponent`
- `dayHeaderComponent`
- `emptyComponent`

Custom renderers receive normalized calendar values plus the semantic and
interaction props required by their view. ChronoLaneJS continues to own layout
and behavior; the renderer owns markup and presentation.

### Styling

The bundled CSS is application-independent. Use `className`, `style`, event
colors and styles, renderer overrides, or the documented custom-property
extension points:

```css
.team-schedule {
    --month-view-day-min-width: 9rem;
    --time-grid-day-min-width: 10rem;
}
```

### Interactions

Selection and editing callbacks receive the normalized source event, never a
clipped time-grid segment. Event renderers receive that source as `event` and
the visible positioned portion as `segment`.

Providing `onEventEdit` enables editing, and providing `onEventDrop` enables
dragging. Use `canEditEvent(event)` or `canDragEvent(event, segment)` to
restrict individual events or visible resource segments.

`onEventDrop` receives the source event, proposed `start` and `end`, and
explicit `source` and `destination` positions. Dropping a clipped multi-day
event preserves the source event's complete duration.

### Custom views

Extend or replace the view registry through `views`:

```tsx
const views = {
    quarter: {
        component: QuarterView,
        defaultProps: { months: 3 }
    }
};

<Calendar
    view="quarter"
    views={views}
    viewProps={{ compact: true }}
/>
```

A custom view receives events, background events, the active view name, shared
calendar props, registered defaults, and `viewProps`. TypeScript infers the
allowed custom view names and `viewProps` from the supplied registry.

## Public API

ChronoLaneJS exports `Calendar` as the default, together with:

- `AgendaView`, `DayView`, `MonthView`, `ResourceView`, `TimeGridView`, and
  `WeekView`;
- `defaultCalendarViews`;
- date parsing and timezone helpers;
- range construction and navigation helpers;
- locale discovery, loading, and preloading helpers;
- public prop, event, range, renderer, resource, registry, and layout types.

Time-grid layout internals and default renderer implementations remain private
so they can evolve without expanding the compatibility surface. Public
functions and components include TSDoc in their generated declarations.

## Development

Requires Node.js 20.19 or newer.

```bash
npm ci
npm run check
npm run check:storybook
npm pack --dry-run
```

Useful focused commands:

| Command | Purpose |
| --- | --- |
| `npm run site` | Run the project website and compact playground |
| `npm run site:build` | Build the GitHub Pages website |
| `npm run storybook` | Run the exhaustive component catalog |
| `npm run storybook:test` | Execute every story in Chromium |
| `npm run storybook:build` | Build the deployable static catalog |
| `npm run locales:generate` | Regenerate date-fns locale loaders |
| `npm run locales:check` | Verify the generated locale registry |

GitHub Actions validates the package and Storybook independently. Published
GitHub releases are prepared for npm trusted publishing with provenance.

## Contributing

Focused bug fixes, tests, documentation improvements, and
application-independent features are welcome. Read
[CONTRIBUTING.md](./CONTRIBUTING.md) before changing public APIs or component
boundaries, and consult the [roadmap](./ROADMAP.md) for the canonical backlog.

## License

ChronoLaneJS is available under the [MIT License](./LICENSE).
