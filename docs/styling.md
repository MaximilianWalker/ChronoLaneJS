# Styling and theming

ChronoLaneJS ships neutral structural CSS. Import it once, then customize from
an application class, typed CSS variables, event data, or renderer boundaries.

```tsx
import "@chronolanejs/react/styles.css";

<Calendar
    className="team-schedule"
    style={{ "--calendar-time-grid-line-width": "0px" }}
/>
```

## Ownership boundary

The library owns geometry required for calendar correctness: visible ranges,
time rows, overlap lanes, clipping, day/resource tracks, interaction attributes,
and scroll containers. Consumers own color, typography, spacing, application
states, and markup at the documented renderer extension points.

Do not target generated inline grid coordinates or internal custom properties
whose names begin `--_`. They are implementation details. Use the public tokens,
stable hooks, `slotSizing`, and renderers below.

## Typed style props

`CalendarStyle` extends React `CSSProperties`, the documented calendar tokens,
and application-defined `--*` properties. `Calendar`, `AgendaView`, `MonthView`,
`DayView`, `WeekView`, and `TimeGridView` all accept `className` and `style`.

```tsx
import type { CalendarStyle } from "@chronolanejs/react";

const scheduleStyle: CalendarStyle = {
    height: 680,
    "--calendar-scrollbar-thumb": "#64748b",
    "--calendar-time-grid-header-row-height": "42px",
    "--product-accent": "#4f46e5"
};

<Calendar className="team-schedule" style={scheduleStyle} />
```

## Public CSS variables

### Scrollbars

| Variable | Type | Default | Effect | Example |
| --- | --- | --- | --- | --- |
| `--calendar-scrollbar-inset` | CSS border width | `3px` | Transparent inset around WebKit/Blink scrollbar thumbs. | `"2px"` |
| `--calendar-scrollbar-radius` | CSS radius | `999px` | Thumb corner radius. | `"8px"` |
| `--calendar-scrollbar-size` | CSS length | `12px` | WebKit/Blink scrollbar width and height. | `"10px"` |
| `--calendar-scrollbar-thumb` | CSS color | `#aab6c5` | Resting thumb color. | `"#64748b"` |
| `--calendar-scrollbar-thumb-hover` | CSS color | `#8493a6` | Hover thumb color. | `"#475569"` |
| `--calendar-scrollbar-track` | CSS color | `transparent` | Track and corner background. | `"#f8fafc"` |
| `--calendar-scrollbar-width` | `auto \| none \| thin` | `thin` | Firefox standardized scrollbar width. | `"auto"` |

These variables apply to `.calendar-scroll-region`, which is used by agenda,
month, and time-grid scroll surfaces. Native platform behavior is retained.

### Time-grid geometry

| Variable | Type | Default | Effect | Example |
| --- | --- | --- | --- | --- |
| `--calendar-time-grid-frame-width` | non-negative pixel string | `1px` | Outer frame border and its fixed-track box geometry. | `"0px"` |
| `--calendar-time-grid-header-row-height` | non-negative pixel string | `36px` | Height of each day/resource header row. Resources add a second row. | `"44px"` |
| `--calendar-time-grid-line-width` | non-negative pixel string | `1px` | Header, slot, and divider grid-line width. Use `0px` to hide visual lines without disabling slots. | `"0px"` |
| `--calendar-time-grid-time-axis-width` | non-negative pixel string | `64px` | Width of both the time labels and the empty header corner. | `"72px"` |

`CalendarPixelSize` is the template type `` `${number}px` ``. Runtime CSS
rejects negative geometry even though TypeScript cannot exclude every negative
numeric template string.

### Month geometry

`--month-view-day-min-width` is a stable CSS hook used by the month grid. It
defaults to `0`; at viewport widths up to `768px`, the bundled theme sets it to
`112px` so the seven-day grid scrolls rather than crushing content.

```css
.team-schedule {
    --month-view-day-min-width: 9rem;
}
```

It is intentionally not part of `CalendarCSSVariables` because it accepts any
CSS length, but `CalendarStyle` still accepts application-defined variables.

## Slot dimensions

Time-grid slot dimensions are component behavior, so they use the typed
`slotSizing` prop rather than CSS variables:

```tsx
<Calendar
    view="week"
    viewProps={{
        slotSizing: {
            minWidth: 120,
            height: 48
        }
    }}
/>
```

| Axis form | Behavior |
| --- | --- |
| `width` | Fixed positive pixel width for each day/resource track; the grid shrink-wraps until constrained and then scrolls. |
| `minWidth` | Fluid equal-width tracks down to a non-negative pixel minimum, then horizontal scrolling. |
| neither width property | Fully fluid columns with no minimum. `WeekView` supplies a `96px` minimum unless either width property is explicit. |
| `height` | Fixed positive pixel height for each `slotDuration`; the grid uses intrinsic total height. |
| `minHeight` | Fluid rows down to a non-negative pixel minimum, then vertical scrolling. Use `0` for fully fluid rows. |
| neither height property | Fixed `50px` slots. |

`width`/`minWidth` and `height`/`minHeight` are mutually exclusive. Time-grid
headers use the exact same track definition as slots, so grouped headers cannot
drift out of alignment.

## Event-level styling

Default renderers consume event presentation fields:

```tsx
const event = {
    id: "launch",
    title: "Launch",
    description: "Release coordination",
    start: "2026-09-14T09:00:00",
    end: "2026-09-14T11:00:00",
    color: "#f97316",
    variant: "striped",
    style: { borderRadius: 14, borderWidth: 2 },
    titleStyle: { textTransform: "uppercase" },
    descriptionStyle: { fontStyle: "italic" }
};
```

- `color` becomes the renderer-local `--color` value.
- `variant` becomes a class on the default time-grid event. The bundled theme
  supplies `default` and `striped`; application classes may define others.
- `style` is merged into the time-grid event root after required positioning.
- `titleStyle` and `descriptionStyle` apply only to the default event content.

For structural markup changes, use a custom renderer instead of selectors that
depend on default renderer descendants.

## Stable class hooks

The following class names are supported consumer styling hooks. State classes
listed here are also stable. Other descendant structure and generated inline
styles may change.

### Shared

- `.calendar`
- `.calendar-scroll-region`
- `.calendar-view_navigation`
- `.calendar-view_navigation-button`
- `.calendar-view_navigation-icon`
- `.calendar-view_navigation-text`

### Agenda

- `.agenda-view`, `.agenda-view_list`
- `.agenda-view_day`, `.agenda-view_day-heading`, `.agenda-view_day-events`
- `.agenda-view_event`, `.agenda-view_event-content`, `.agenda-view_empty`
- `.is-selected` on the default event root

### Month

- `.month-view`, `.month-view_grid-wrapper`, `.month-view_grid`
- `.month-view_weekdays`, `.month-view_weekday`, `.month-view_week`
- `.month-view_day`, `.month-view_day-button`
- `.month-view_background-event`, `.month-view_events`, `.month-view_event`
- `.month-view_event-time`, `.month-view_event-title`, `.month-view_more`
- `.is-outside`, `.is-selected` on their documented roots

### Time grid

- `.time-grid-view`, `.time-grid-view_grid-wrapper`
- `.time-grid-view_header`, `.time-grid-view_header-cell`
- `.time-grid-view_multi-day-region`, `.time-grid-view_multi-day-label`,
  `.time-grid-view_multi-day-grid`, `.time-grid-view_multi-day-event`
- `.time-grid-view_body`, `.time-grid-view_time-labels`, `.time-grid-view_time-label`
- `.time-grid-view_grid-stage`, `.time-grid-view_grid`
- `.time-grid-view_slot-row`, `.time-grid-view_slot-cell`, `.time-grid-view_slot`
- `.time-grid-view_event-layer`
- `.time-grid-view_background-events`, `.time-grid-view_background-event`
- `.time-grid-view_column-events`, `.time-grid-view_event`
- `.time-grid-view_event-color-bar`, `.time-grid-view_event-content`
- `.time-grid-view_event-title`, `.time-grid-view_event-description`
- `.has-resource-headers`, `.has-fixed-slot-width`, `.has-fixed-slot-height`
- `.is-primary`, `.is-secondary`, `.is-first-column`, `.is-divider-boundary`,
  and `.is-selected` on their documented roots

Example:

```css
.team-schedule .time-grid-view_event {
    box-shadow: 0 4px 12px rgb(15 23 42 / 12%);
}

.team-schedule .calendar-view_navigation-text {
    font-family: "Inter", sans-serif;
}
```

## Custom renderer boundary

Use `components` when presentation requires different markup. A renderer must
spread its `elementProps` to preserve geometry, labels, focus, event handlers,
and drag behavior:

```tsx
function EventRenderer({ event, selected, elementProps }: TimeGridEventProps<Meeting>) {
    const interactive = Boolean(elementProps.onClick || elementProps.onDoubleClick);
    const Root = interactive ? "button" : "div";

    return (
        <Root
            {...elementProps}
            type={interactive ? "button" : undefined}
            className={`${elementProps.className} product-event`}
            aria-pressed={interactive ? selected : undefined}
        >
            <span className="product-event__title">{event.title}</span>
        </Root>
    );
}
```

See the [renderer API](./api.md#renderer-contracts) and
[accessibility responsibilities](./accessibility.md#custom-renderer-responsibilities).

## Responsive behavior

- The root fills its containing block's width.
- Agenda day/event columns collapse to one column below `600px`.
- Month switches to `112px` minimum day columns below `768px` and scrolls
  horizontally.
- Time grids preserve configured tracks and scroll in either direction rather
  than silently shrinking fixed/minimum slots.
- Navigation spacing and buttons compact below `768px`.
- A fluid-height time grid needs an ancestor with a definite height; otherwise
  use fixed slot height or allow intrinsic height.
- The theme disables navigation transitions under `prefers-reduced-motion`.

Test application overrides at 200% zoom, narrow viewport widths, high-contrast
settings, and both mouse and keyboard focus. Do not remove focus indicators.
