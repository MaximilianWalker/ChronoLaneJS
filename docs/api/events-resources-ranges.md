# Events, resources, and ranges

This reference covers the public data contracts used to describe events,
resource columns, selections, and visible ranges. Start with the
[API overview](../api.md) to find another contract area.

## Event types

<!-- api:CalendarEvent CalendarEventId NormalizedCalendarEvent CalendarDateInput CalendarSelectionRange CalendarStyle CalendarCSSVariables CalendarPixelSize -->
<!-- props:CalendarCSSVariables --calendar-scrollbar-inset --calendar-scrollbar-radius --calendar-scrollbar-size --calendar-scrollbar-thumb --calendar-scrollbar-thumb-hover --calendar-scrollbar-track --calendar-scrollbar-width --calendar-time-grid-frame-width --calendar-time-grid-header-row-height --calendar-time-grid-line-width --calendar-time-grid-time-axis-width -->
<!-- props:CalendarEvent id title description start end color variant resourceId resourceIds resource style titleStyle descriptionStyle -->
<!-- props:CalendarSelectionRange start end -->

### `CalendarDateInput`

`Date | string | number`. Date-only `YYYY-MM-DD` strings retain local calendar
fields. Other strings use the JavaScript `Date` parser. Numbers are Unix epoch
milliseconds.

### `CalendarSelectionRange`

| Field | Type | Meaning | Example |
| --- | --- | --- | --- |
| `start` | `CalendarDateInput` | Inclusive selection boundary. | `"2026-09-14T09:00:00"` |
| `end` | `CalendarDateInput` | Exclusive boundary; it must be later than `start`. | `"2026-09-14T10:30:00"` |

Both boundaries are cloned, validated, and attached to the view's configured
`timeZone` while preserving their visible wall-clock fields. Invalid values
throw `TypeError`; equal or reversed boundaries throw `RangeError`.

### `CalendarEvent`

| Field | Type | Required | Meaning | Example |
| --- | --- | --- | --- | --- |
| `id` | `string \| number` | no | Stable selection/key identity. | `"planning"` |
| `title` | `string` | no | Primary visible and accessible label. | `"Planning"` |
| `description` | `string` | no | Secondary renderer and accessible-label content. | `"Set weekly priorities"` |
| `start` | `CalendarDateInput` | yes | Inclusive event boundary. | `"2026-09-14T09:00:00"` |
| `end` | `CalendarDateInput` | yes | Exclusive event boundary. | `"2026-09-14T10:15:00"` |
| `color` | `string` | no | Value exposed to default renderers as `--color`. | `"#2563eb"` |
| `variant` | `string` | no | Adds a variant class to the default time-grid renderer. | `"striped"` |
| `resourceId` | `CalendarResourceId` | no | Single resource assignment. | `"studio"` |
| `resourceIds` | `CalendarResourceId[]` | no | Multiple assignments; takes precedence over `resourceId`. | `["studio", "terrace"]` |
| `resource` | `unknown` | no | Legacy-shaped assignment source; `{ id }` is used only when explicit IDs are absent. Prefer `resourceId(s)`. | `{ id: "studio" }` |
| `style` | `CalendarStyle` | no | Styles merged into the default time-grid event root after layout styles. | `{ borderRadius: 12 }` |
| `titleStyle` | `CSSProperties` | no | Styles used by default event title markup. | `{ fontWeight: 700 }` |
| `descriptionStyle` | `CSSProperties` | no | Styles used by default event description markup. | `{ fontStyle: "italic" }` |

`NormalizedCalendarEvent<Event>` retains all event fields and replaces `start`
and `end` with validated `Date` objects. Callbacks and renderer contracts use
this normalized source.

Invalid event boundaries throw a contextual `TypeError`. Equal or reversed
event intervals throw `RangeError`; every event must satisfy `end > start`.

## Resource types

<!-- api:CalendarResourceConfig CalendarResourceId -->
<!-- props:CalendarResourceConfig items getId getTitle getEventIds -->

`CalendarResourceId` is a non-empty string or finite number. Equality uses the
native identity of those primitives.

| `CalendarResourceConfig` field | Default convention | Meaning | Example |
| --- | --- | --- | --- |
| `items` | required | Concrete resources rendered for every visible day. | `[{ id: "studio", name: "Studio" }]` |
| `getId` | `resource.id` | Returns one stable resource ID. | `(room) => room.code` |
| `getTitle` | `title`, then `name`, then `id` | Returns prepared React header content. | `(room) => <strong>{room.label}</strong>` |
| `getEventIds` | `resourceIds`, then `resourceId`, then `resource.id` | Returns all assignments for a normalized event. | `(event) => event.roomCodes` |

Missing/invalid IDs throw `TypeError`; duplicate resource IDs throw
`RangeError`; a non-array `getEventIds` result throws `TypeError`.

## Range types

<!-- api:CalendarRange CalendarRangeContext CalendarRangeDefinition CalendarRangeNavigation CalendarRangeOptions ResolvedCalendarRange CalendarWeekStart -->
<!-- props:CalendarRange start end days -->
<!-- props:CalendarRangeContext weekStartsOn -->
<!-- props:ResolvedCalendarRange navigate -->

`CalendarWeekStart` is `0 | 1 | 2 | 3 | 4 | 5 | 6`, Sunday through Saturday.
`CalendarRangeContext` contains `weekStartsOn`.

`CalendarRangeDefinition` accepts:

- `"day"` or `"week"`;
- a positive integer consecutive-day count;
- a fixed explicit `Date[]`, normalized, deduplicated, and sorted;
- `CalendarRangeOptions`;
- a callback `(anchorDate, context) => CalendarRangeDefinition`.

| `CalendarRangeOptions` field | Type | Meaning | Example |
| --- | --- | --- | --- |
| `start` | `Date` or callback | Inclusive range start; defaults to the anchor. | `(anchor) => startOfWeek(anchor)` |
| `end` | `Date` or callback | Inclusive end. Use exactly one of `end` or `dayCount`. | `new Date(2026, 8, 18)` |
| `dayCount` | `number` | Positive integer generated-day count when `end` is omitted. | `5` |
| `dates` | `Date[]` or callback | Explicit non-contiguous days. Use a callback for an anchor-relative pattern; this form cannot be combined with span fields. | `(anchor) => [anchor, addDays(anchor, 2)]` |
| `includeDay` | `(day) => boolean` | Filters generated days; at least one must remain. | `(day) => day.getDay() !== 0` |
| `navigation` | `CalendarRangeNavigation` | Optional strategy carried into the resolved range. | `{ stepDays: 7 }` |

`CalendarRangeNavigation` has exactly one of these shapes:

```ts
type CalendarRangeNavigation =
    | { stepDays: number }
    | {
        resolveAnchor: (
            anchorDate,
            direction,
            resolvedRange,
            context
        ) => Date
    };
```

`stepDays` is a positive integer calendar-day movement. `resolveAnchor`
supports domain-specific movement and must return a valid `Date`. It receives
the current anchor, `-1` or `1`, the normalized `CalendarRange`, and
`CalendarRangeContext`.

```tsx
const workWeek: CalendarRangeDefinition = {
    start: (anchor, { weekStartsOn }) => startOfWeek(anchor, { weekStartsOn }),
    dayCount: 7,
    includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5,
    navigation: { stepDays: 7 }
};

const reviewDays: CalendarRangeDefinition = {
    dates: (anchor) => [
        anchor,
        addDays(anchor, 2),
        addDays(anchor, 4)
    ],
    navigation: {
        resolveAnchor: (anchor, direction) => addWeeks(anchor, direction)
    }
};
```

Presets and shorthand counts own deterministic defaults: `"day"` moves one
day, `"week"` moves seven, and `range={5}` moves five. A generated span without
an explicit strategy moves by its unfiltered `dayCount` or `start`/`end` span.
An explicit array derives an anchor movement from its inclusive first-to-last
span, but its literal days remain absolute. Use it with `showControls={false}`
for a fixed range. Anchor-aware `dates` regenerate a recurring non-contiguous
pattern after navigation. Wrapping either form in `{ dates, navigation }`
supplies a different strategy. Callback-produced definitions retain whichever
strategy they return.

`CalendarRange` contains inclusive `start`, inclusive `end`, and the resolved
`days`. It is open to view-specific fields; month ranges include `monthStart`
and `monthEnd`. `ResolvedCalendarRange` adds `navigate(direction)`, which
returns the next valid anchor from the strategy resolved with those days.

### Range navigation migration

The old view-level controls are removed rather than retained as aliases:

| Removed form | Canonical replacement |
| --- | --- |
| `navigationStep={7}` | `range={{ ..., navigation: { stepDays: 7 } }}` |
| `navigateDate={resolver}` | `range={{ ..., navigation: { resolveAnchor: resolver } }}` |
| range option `{ days: 7 }` | `{ dayCount: 7 }` |

`MonthView.navigateDate` has no replacement because a month view always moves
to the previous or next displayed month. Use a configurable time-grid or
agenda range when the visible unit requires custom navigation.
