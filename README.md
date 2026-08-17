<p align="center">
  <img src="./assets/chronolane-logo.svg" width="176" alt="ChronoLaneJS logo" />
</p>

<h1 align="center">ChronoLaneJS</h1>

<p align="center">
  <strong>A modern, timezone-aware calendar for React.</strong>
</p>

<p align="center">
  Day, week, month, agenda, and custom time-grid views with resource columns<br />
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
  <a href="./docs/README.md">Documentation</a>
  &middot;
  <a href="#core-concepts">Core concepts</a>
  &middot;
  <a href="./ROADMAP.md">Roadmap</a>
  &middot;
  <a href="./DEVELOPMENT.md">Development</a>
</p>

---

ChronoLaneJS is a customizable React calendar with day, week, month, agenda,
and custom time-grid views. It provides timezone-aware date handling,
range navigation, event layout, interactions, and accessible defaults while
keeping state management and persistence outside the component.

> [!NOTE]
> `@chronolanejs/react` is published on npm through a provenance-enabled trusted
> publishing workflow. Remaining follow-up work is tracked in the
> [roadmap](./ROADMAP.md).

## Why ChronoLaneJS?

- **Views that share one model:** day, week, month, agenda, and
  arbitrary time-grid ranges use the same event and navigation contracts.
- **Correct across time:** IANA timezones, daylight-saving transitions, lazy
  date-fns locales, and explicit week-start behavior are built in.
- **Flexible layout:** overlapping events, clipped multi-day events,
  background events, resources, and non-contiguous ranges are first-class.
- **Flexible integration:** controlled or uncontrolled navigation, event
  selection/opening, resizing, and event movement integrate with your state layer.
- **Customizable presentation:** override the meaningful render boundaries or
  style the defaults without inheriting a design system.
- **Typed and tested:** the ESM package emits declarations from source, and
  every Storybook example runs as a browser and accessibility test.

## Interactive documentation

The [project website](https://maximilianwalker.github.io/ChronoLaneJS/) includes
a compact playground with every built-in view and resource-column mode. The exhaustive
[Storybook](https://maximilianwalker.github.io/ChronoLaneJS/storybook/) covers
every public customization point, including:

- event overlap, overnight events, and multi-day clipping;
- resources, background events, and custom ranges;
- custom renderers and view registration;
- locale, timezone, and daylight-saving transitions;
- responsive layouts, selection, opening, resizing, and event movement.

Use Storybook's toolbar to change the locale, IANA timezone, and viewport. The
website and full catalog are rebuilt and deployed together from `main`.

## Installation

Install the package and its peer dependencies with:

```bash
npm install @chronolanejs/react react react-dom date-fns @date-fns/tz
```

Import the package stylesheet once at your application entry point:

```ts
import "@chronolanejs/react/styles.css";
```

To evaluate the development build and Storybook locally, clone the repository:

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
| `time-grid` | Generic, configurable time-grid renderer |

`day` and `week` are presets over `TimeGridView`; they share its layout and
interaction behavior rather than maintaining separate engines. Resource
columns are available on both presets and on every custom time-grid range.

The root `Calendar` props are a discriminated TypeScript union keyed by
`view`. Shared calendar behavior stays at the root, while configuration owned
by the selected view lives under `viewProps`. Omitting `view` selects the
`week` contract. Misspelled props, view configuration placed at the root, and
combinations such as time-grid scale options on a month view fail compilation.
Direct view components accept their own configuration as direct props.
Use `satisfies CalendarViewProps<"month">` (with the appropriate view name)
when defining reusable `viewProps` objects so TypeScript checks the object at
its declaration site.

### Ranges

Time-grid and agenda ranges accept:

- `"day"` or `"week"`;
- a positive number of consecutive days;
- an array of visible dates;
- `{ start, end }` or `{ start, dayCount }`;
- `{ dates, navigation }` for non-contiguous days with explicit movement;
- a callback returning any supported definition.

```tsx
import { startOfWeek } from "date-fns";

<Calendar
    view="time-grid"
    viewProps={{
        range: {
            start: (anchor) => startOfWeek(anchor, { weekStartsOn: 1 }),
            dayCount: 7,
            includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5,
            navigation: { stepDays: 7 }
        }
    }}
/>
```

Non-contiguous ranges are supported, so business calendars do not need a
dedicated work-week view. The range owns previous/next behavior through
`navigation: { stepDays }` or a custom `navigation.resolveAnchor` callback.
Use anchor-aware `dates` for a recurring non-contiguous pattern; a literal
`Date[]` represents a fixed set of days.

### Time-grid scale

Time-grid views keep the visible wall-clock range separate from selection and
label cadence:

```tsx
<Calendar
    view="week"
    viewProps={{
        minTime: "08:00",
        maxTime: "18:00",
        slotDuration: 30,
        resizeStep: 15,
        labelInterval: 60
    }}
/>
```

`minTime` is inclusive and `maxTime` is exclusive. Both use strict,
zero-padded `HH:mm` values; `maxTime` also accepts `24:00`. `slotDuration`
controls selectable granularity, `resizeStep` independently controls pointer,
touch, and keyboard resize precision, and `labelInterval` controls time labels
and major dividers. Invalid configurations throw rather than being silently
adjusted.

### Slot sizing

Time-grid slot dimensions use one flat typed contract. `width` and `height`
fix their slot axis, while `minWidth` and `minHeight` distribute available
space until the minimum would be crossed and then enable scrolling:

```tsx
<Calendar
    view="day"
    viewProps={{
        slotSizing: {
            minWidth: 120,
            height: 48
        }
    }}
/>
```

`width` and `minWidth` are mutually exclusive, as are `height` and
`minHeight`. Omitting both width properties gives fluid columns with no
minimum. Omitting both height properties retains the fixed `50px` default;
use `minHeight: 0` for fully fluid rows. Fixed dimensions must be positive
finite CSS pixel sizes. Minimum dimensions may also be zero. Invalid or
conflicting values throw `RangeError` during rendering. Fixed dimensions
shrink-wrap the time grid on that axis until its parent constrains it. Fluid
height requires a parent with a definite height so there is vertical space to
distribute.

Time-grid headers use the same column tracks as their slots. A grouped day or
resource header spans its underlying tracks and never establishes an
independent width, so custom header content cannot drift out of alignment.

### Locales and timezones

`locale` accepts a supported locale name or a date-fns locale object. `en-US`
is the synchronous default; other named locales are loaded lazily and cached.

```tsx
<Calendar locale="pt-PT" timeZone="Europe/Lisbon" />
```

Call `preloadCalendarLocale(name)` when a locale should be available before
render. A view-specific `weekStart` overrides the locale convention.

Locales format dates and supply calendar conventions. Application labels such
as navigation and empty-state text remain caller-controlled through
`messages`.

### Resources

Resources are arbitrary values rather than a room-specific abstraction:

```tsx
import type { CalendarResourceConfig } from "@chronolanejs/react";

const calendarResources: CalendarResourceConfig<ScheduleEvent, Person> = {
    items: people,
    getId: (person) => person.uuid,
    getTitle: (person) => person.displayName,
    getEventIds: (event) => event.assigneeUuids
};

<Calendar
    view="day"
    events={events}
    viewProps={{ resources: calendarResources }}
/>
```

The `resources` object keeps its items and accessors under one inferred generic
contract. The defaults read `resource.id`, select a title from
`resource.title`, `resource.name`, or `resource.id`, and read assignments from
`event.resourceIds`, `event.resourceId`, or `event.resource.id`.

Resource IDs are `CalendarResourceId` values: non-empty strings or finite
numbers. Equality uses JavaScript `Map`/`Set` SameValueZero semantics: `1` and
`"1"` identify different resources, while `0` and `-0` identify the same one.
Missing or duplicate item IDs throw before layout is rendered.
Event assignments use set behavior: repeated IDs produce one segment per
matching column, while IDs absent from `items` do not produce a segment.

Omitting `resources`, or supplying an empty `items` array, creates one
ungrouped column per visible day and does not render a resource-header row.
When resource columns are configured, `groupBy="day"` (the default) renders
each day above its resources. Set `groupBy="resource"` to render each resource
above its visible days:

```tsx
<Calendar
    view="week"
    events={events}
    viewProps={{
        resources: calendarResources,
        groupBy: "resource"
    }}
/>
```

Both orders use the same day-resource columns and event assignments; only the
outer grouping and physical column order change. The concrete item remains
available as `column.resource`, `slot.resource`, `segment.resource`, and in
both event-drop positions. Stable IDs are available alongside those values.

## Customization

### Renderers

Views expose intentional renderer boundaries where applicable:

| View | `components` keys |
| --- | --- |
| Agenda | `event`, `dayHeader`, `empty`, `navigation` |
| Month | `event`, `dayHeader`, `navigation` |
| Time grid and presets | `event`, `slot`, `backgroundEvent`, `dayHeader`, `resourceHeader`, `navigation` |

```tsx
<Calendar
    view="week"
    events={events}
    viewProps={{
        components: {
            event: ScheduleEvent,
            slot: ScheduleSlot,
            navigation: ScheduleNavigation
        }
    }}
/>
```

Time-grid event renderers receive `{ event, segment, selected, elementProps }`,
slot renderers receive `{ slot, selected, elementProps }`, and day/resource
header renderers receive their concrete value, indexes, covered columns, and
prepared title. Positional values remain available without duplication on the
segment, slot, or covered columns. Agenda and month event renderers receive the
normalized `event`, their prepared visible values, `selected`, and
`elementProps`.

Spread `elementProps` onto the renderer's root element to retain layout,
accessibility, selection, opening, and raw event behavior. ChronoLaneJS owns those
behaviors while the renderer owns markup and presentation.

### Styling

The bundled CSS provides the same neutral, product-ready presentation used by
the Storybook examples and website playground. Time grids include bordered
surfaces, aligned header dividers, centered time labels, and compact event
cards without requiring application CSS.

Use `className`, `style`, event colors and styles, renderer overrides, or the
documented custom-property extension points to adapt that default:

```css
.team-schedule {
    --month-view-day-min-width: 9rem;
}
```

`CalendarStyle` provides autocomplete for the supported calendar tokens while
remaining compatible with regular React styles and application-defined CSS
variables. The same typed `className` and `style` props are available on
`Calendar`, `AgendaView`, `MonthView`, `DayView`, `WeekView`, and
`TimeGridView`:

```tsx
<Calendar
    view="week"
    style={{
        "--calendar-time-grid-header-row-height": "40px",
        "--calendar-time-grid-time-axis-width": "72px",
        "--calendar-time-grid-line-width": "0px",
        "--calendar-time-grid-frame-width": "1px"
    }}
/>
```

Header height applies to each header row. Resource columns therefore add a
second full-height row. The time-axis token sizes both the label column and its
empty header corner. Set the line width to `0px` to remove header and slot grid
lines consistently. Layout-sensitive time-grid tokens accept deterministic
non-negative pixel lengths. TypeScript cannot exclude negative numeric
template strings, which browsers treat as invalid for these sizes. The
frame-width token controls both the visible outer border
and the time grid's intrinsic border-box geometry, so custom frames cannot
desynchronize the fixed slot tracks.

Scrollable calendar surfaces retain native browser behavior while using a
compact inset thumb by default. Override the shared scrollbar tokens on the
`Calendar` root or any ancestor:

```tsx
<Calendar
    className="team-schedule"
    style={{
        "--calendar-scrollbar-size": "14px",
        "--calendar-scrollbar-width": "auto",
        "--calendar-scrollbar-inset": "4px",
        "--calendar-scrollbar-thumb": "#64748b",
        "--calendar-scrollbar-thumb-hover": "#475569",
        "--calendar-scrollbar-track": "transparent",
        "--calendar-scrollbar-radius": "999px"
    }}
/>
```

The `calendar-scroll-region` class is the stable advanced extension point for
projects that need to replace the browser-specific scrollbar rules entirely.
The CSS variables inherit into time-grid, month, and agenda scroll regions, so
one root override keeps every built-in view consistent. The
`--calendar-scrollbar-width` token controls the standards-based scrollbar;
Chromium and Safari use `--calendar-scrollbar-size` so their inset thumb and
hidden end buttons can be enforced through the WebKit scrollbar API.

### Interactions

Selection and opening callbacks receive the normalized source event and a
rendered-occurrence context, never a clipped source in place of the event.
Single click and Space select; double-click, double-tap, and Enter open. These
gestures never change meaning based on which callbacks are present.

`eventInteractions` adds raw click, double-click, context-menu, and key-down
callbacks without replacing the semantic behavior. Use `canSelectEvent` and
`canOpenEvent` to restrict those semantic actions per event occurrence.

Supplying `viewProps.onEventDrop` exposes an event move handle with pointer,
touch, and keyboard support. Movement previews the complete event, targets the
visible `slotDuration` scale, and announces each proposed date, time, and
resource. Arrow Up/Down changes time, Arrow Left/Right changes the visible
column, Enter or blur commits, and Escape cancels. Supplying
`viewProps.onEventResize` exposes equivalent start/end resize handles. Resizes
snap by `resizeStep` independently from the visual slots and preserve the
resource. Use `canDragEvent` and `canResizeEvent` for per-segment restrictions.

`onEventDrop` receives the source event, proposed `start` and `end`, and
explicit `source` and `destination` positions. Moving a clipped multi-day
event preserves the source event's complete duration. Each position includes
both the concrete `resource` value and its stable `resourceId`.

`onEventResize` receives the source event, changed edge, proposed complete
boundaries, and source day/resource position. ChronoLaneJS proposes changes;
application state remains consumer-owned.

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

The complete consumer documentation is organized as GitHub-native Markdown and
rendered from the same files on the project site:

- [Getting started](./docs/getting-started.md)
- [Complete API reference](./docs/api.md)
- [Styling and theming](./docs/styling.md)
- [Runnable examples](./docs/examples.md)
- [Accessibility](./docs/accessibility.md)

ChronoLaneJS exports `Calendar` as the default, together with:

- `AgendaView`, `DayView`, `MonthView`, `TimeGridView`, and `WeekView`;
- `defaultCalendarViews`;
- date parsing and timezone helpers;
- range construction and navigation helpers;
- locale discovery, loading, and preloading helpers;
- public prop, event, range, renderer, resource, registry, and layout types.

Time-grid layout internals and default renderer implementations remain private
so they can evolve without expanding the compatibility surface. Public
functions and components include TSDoc in their generated declarations.

## Runtime support

ChronoLaneJS supports these runtime combinations:

| Runtime | Supported versions |
| --- | --- |
| Node.js | `>=22.14.0 <23`, `>=24.10.0 <25`, or `>=26.0.0 <27` |
| React and React DOM | matching `>=18.2.0 <20` releases |
| Chrome and Edge | 111 or newer |
| Firefox | 114 or newer |
| Safari and iOS Safari | 16.4 or newer |

Node support follows upstream-maintained release lines. Future Node majors are
not supported until they are added to the compatibility matrix. CI tests the
minimum supported React release on every supported Node major and also tests
the repository's current React release during full validation.

The browser targets match the package's explicit Baseline Widely Available
build target. Supported browsers require native ES modules, `Intl.Locale`, and
`Intl.DateTimeFormat` with IANA timezone data. They need no polyfills.
ChronoLaneJS does not ship polyfills; older browsers and runtimes with
incomplete internationalization data are unsupported.

## Development

Requires a supported Node.js version from the matrix above.

```bash
npm ci
npm run check
npm run examples:check
npm run check:storybook
npm pack --dry-run
```

Useful focused commands:

| Command | Purpose |
| --- | --- |
| `npm run site` | Run the project website and compact playground |
| `npm run site:build` | Build the GitHub Pages website |
| `npm run storybook` | Run the exhaustive component catalog |
| `npm run storybook:test` | Execute every story in Chromium and Firefox |
| `npm run storybook:build` | Build the deployable static catalog |
| `npm run examples:check` | Pack one artifact, install it into clean Vite and Next.js consumers, and verify both production builds |
| `npm run locales:generate` | Regenerate date-fns locale loaders |
| `npm run locales:check` | Verify the generated locale registry |

GitHub Actions validates the package, packed-artifact consumers, and Storybook
as independent boundaries. Releases use npm trusted publishing with
provenance.

## Author

**[Diogo Marques Crava](https://diogocrava.dev)**

- Website: [diogocrava.dev](https://diogocrava.dev)
- GitHub: [@MaximilianWalker](https://github.com/MaximilianWalker)
- LinkedIn: [Diogo Crava](https://www.linkedin.com/in/diogo-crava/)

Feel free to contact me through any of the platforms above.

## License

ChronoLaneJS is available under the [MIT License](./LICENSE).
