# ChronoLane

A composable, timezone-aware calendar toolkit for React.

ChronoLane provides day, week, month, agenda, resource, and configurable
time-grid views without imposing application state, a design system, or a data
backend. Every major renderer can be replaced while the date, range, locale,
resource, and overlap behavior remains reusable.

> ChronoLane is pre-1.0. Its public API is usable, but breaking changes may be
> made while the package is being extracted and documented.

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
npm install chronolane react react-dom date-fns @date-fns/tz
```

Import the package stylesheet once in your application:

```ts
import "chronolane/styles.css";
```

## Quick start

```tsx
import Calendar from "chronolane";
import "chronolane/styles.css";

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

ChronoLane's package entry is marked as a client module and can be imported
from a Next.js client component without a framework-specific wrapper.

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
interaction props required by that view. ChronoLane owns layout and behavior;
the renderer owns markup and presentation.

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

ChronoLane exports `Calendar` as the default plus:

- `AgendaView`, `DayView`, `MonthView`, `ResourceView`, `TimeGridView`, and
  `WeekView`;
- `defaultCalendarViews`;
- date parsing and timezone helpers;
- range construction and navigation helpers;
- locale discovery, loading, and preloading helpers.

Time-grid layout internals and default renderer implementations are private so
they can evolve without expanding the package compatibility surface.

## Architecture

```text
src/
|-- Calendar.tsx           Public calendar component
|-- types.ts               Shared public and internal contracts
|-- core/                  Pure date, event, locale, and range behavior
|-- hooks/                 Shared React state
|-- components/            Components shared across views
`-- views/
    |-- agenda/            Agenda feature and its renderers
    |-- month/             Month feature and its renderers
    `-- time-grid/         Controller, renderer, layout, and presets
```

Views may depend on shared components, hooks, and core modules. Shared modules
never depend on a view, and one view never imports another view's internals.

React component files use PascalCase (`TimeGridView.tsx`), while hooks, pure
modules, and generated registries use camelCase (`useViewDate.ts`,
`timeGridLayout.ts`). Component styles use the same basename as their owner.

## Development

```bash
npm install
npm run check
npm pack --dry-run
```

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
