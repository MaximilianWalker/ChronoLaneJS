# API reference

This is the exhaustive reference for the `@chronolanejs/react` package root.
All examples import from `@chronolanejs/react`; import the bundled CSS separately
from `@chronolanejs/react/styles.css`.

## Component map

| Export | Purpose | Props |
| --- | --- | --- |
| default `Calendar` | Type-safe root that selects a registered view | `CalendarProps` |
| `AgendaView` | Direct agenda list | `AgendaViewProps` |
| `MonthView` | Direct month grid | `MonthViewProps` |
| `DayView` | One-day `TimeGridView` preset | `TimeGridViewProps` |
| `WeekView` | Seven-day `TimeGridView` preset | `TimeGridViewProps` |
| `TimeGridView` | Direct configurable time grid | `TimeGridViewProps` |

<!-- api:default CalendarProps CalendarBuiltInView CalendarViewProps CalendarViewRegistration CalendarViewRegistry AgendaView MonthView DayView WeekView TimeGridView -->

## `Calendar`

`Calendar` owns shared behavior and forwards view-specific configuration under
`viewProps`. Its generic parameters are `Event`, `Resource`, and `Views`.

```tsx
<Calendar<Meeting, Room>
    view="week"
    events={meetings}
    timeZone="UTC"
    viewProps={{ resources: roomConfig, minTime: "08:00" }}
/>
```

### Root props

| Prop | Type | Default | Meaning | Example |
| --- | --- | --- | --- | --- |
| `view` | `CalendarBuiltInView` or registered custom name | `"week"` | Selects the view and discriminates `viewProps`. | `view="month"` |
| `views` | `CalendarViewRegistry` | `{}` | Adds or overrides views by name. | `{ quarter: QuarterView }` |
| `viewProps` | `Partial<CalendarViewProps<typeof view>>` | `{}` | Configuration owned by the selected view. Shared root props are rejected here. | `{ minTime: "08:00" }` |
| `className` | `string` | none | Adds a class to the outer `.calendar` element. | `"team-schedule"` |
| `style` | `CalendarStyle` | none | Adds React styles and typed calendar CSS variables to the outer element. | `{ "--calendar-time-grid-line-width": "0px" }` |
| `localeFallback` | `ReactNode` | `null` | Suspense fallback shown while a named locale module loads. | `<Spinner />` |

All [shared view props](#shared-view-props) are also accepted at the root.
Unknown view names throw `Error: Calendar view "<name>" is not registered.`

### View registry types

`CalendarBuiltInView` is `"agenda" | "day" | "month" | "time-grid" | "week"`.
`CalendarViewProps<View>` extracts only the configuration owned by one built-in
view. `CalendarViewRegistration` is a React component or a
`CalendarViewDefinition`. `CalendarViewRegistry` maps names to registrations.

```tsx
import type { SharedViewProps } from "@chronolanejs/react";

interface QuarterProps extends SharedViewProps<Meeting> {
    heading?: string;
}

function QuarterView({ events = [], heading = "Quarter" }: QuarterProps) {
    return <section><h2>{heading}</h2><p>{events.length} events</p></section>;
}

const views = {
    quarter: {
        component: QuarterView,
        defaultProps: { heading: "Launch quarter" }
    }
};

<Calendar<Meeting, unknown, typeof views>
    view="quarter"
    views={views}
    viewProps={{ heading: "Q3" }}
/>
```

Explicit `viewProps` override registered `defaultProps`. The root then owns and
overrides forwarded `events`, `backgroundEvents`, locale, formatters, messages,
and `viewName` so a custom view receives the same shared contract.

## Shared view props

`SharedViewProps<Event, Resource>` is accepted by every direct view. `Calendar`
accepts the same props except `viewName`, `className`, and `style`, which it
owns at the root.

<!-- api:SharedViewProps -->
<!-- props:SharedViewProps className style events backgroundEvents date defaultDate locale formatters messages viewName timeZone minDate maxDate showControls selectedEventIds canSelectEvent canOpenEvent onDateChange onRangeChange onEventSelect onEventOpen eventInteractions -->

| Prop | Type | Default | Meaning | Example |
| --- | --- | --- | --- | --- |
| `className` | `string` | none | Adds a class to the direct view root. | `"compact-agenda"` |
| `style` | `CalendarStyle` | none | Adds styles and calendar variables to the direct view root. | `{ height: 640 }` |
| `events` | `Event[]` | `[]` | Foreground events. Boundaries are normalized; extra fields are retained. | `[{ id: "a", start: "2026-09-14T09:00", end: "2026-09-14T10:00" }]` |
| `backgroundEvents` | `Event[]` | `[]` | Non-interactive availability/background regions. Agenda currently ignores them. | `[{ start: "2026-09-14T12:00", end: "2026-09-14T13:00", color: "#fee2e2" }]` |
| `date` | `CalendarDateInput` | none | Controlled navigation anchor. | `"2026-09-14"` |
| `defaultDate` | `CalendarDateInput` | current time | Initial uncontrolled anchor; ignored when `date` is supplied. | `new Date(2026, 8, 14)` |
| `locale` | `CalendarLocale` | `"en-US"` | date-fns locale object or supported BCP 47-style name. Named non-default locales may suspend. | `"en-GB"` |
| `formatters` | `CalendarFormatters` | `defaultCalendarFormatters` | Complete registry for calendar-owned date/time rendering. | `{ ...defaultCalendarFormatters, time: customTime }` |
| `messages` | `CalendarMessages` | `defaultCalendarMessages` | Complete registry for visible and accessible library text. | `{ ...defaultCalendarMessages, next: () => "Next period" }` |
| `viewName` | `string` | view-specific | Identity supplied to formatter/message contexts. Normally set only on a direct view or custom wrapper. | `"work-week"` |
| `timeZone` | `string` | host local zone | IANA zone used for calendar-field normalization and arithmetic. | `"UTC"` |
| `minDate` | `CalendarDateInput \| null` | `null` | Inclusive earliest navigation day. Previous navigation is disabled when the anchor or active period reaches/crosses it; visible days and events are not filtered. | `"2026-01-01"` |
| `maxDate` | `CalendarDateInput \| null` | `null` | Inclusive latest navigation day. Next navigation is disabled when the anchor or active period reaches/crosses it; visible days and events are not filtered. | `"2026-12-31"` |
| `showControls` | `boolean` | `true` | Shows the built-in range header and navigation controls. | `false` |
| `selectedEventIds` | `CalendarEventId[]` | `[]` | Marks matching event renderers selected. The library does not update the collection. | `["planning", 42]` |
| `canSelectEvent` | `(event, context) => boolean` | allow all | Restricts semantic selection for one normalized source event occurrence. | `(_, { occurrence }) => occurrence.resourceId !== "locked"` |
| `canOpenEvent` | `(event, context) => boolean` | allow all | Restricts semantic opening for one normalized source event occurrence. | `(event) => event.owner.id === user.id` |
| `onDateChange` | `(date: Date) => void` | none | Fires after navigation requests a normalized anchor, in controlled and uncontrolled modes. | `setDate` |
| `onRangeChange` | `(range: CalendarRange) => void` | none | Fires after the visible range resolves. Month payloads also carry `monthStart` and `monthEnd`. | `({ days }) => fetchDays(days)` |
| `onEventSelect` | `(event, interaction, context) => void` | none | Enables single-click and Space selection. A double-click selects once. | `(event) => setSelected([event.id!])` |
| `onEventOpen` | `(event, interaction, context) => void` | none | Enables double-click, double-tap, and Enter opening. | `(event) => openEditor(event)` |
| `eventInteractions` | `CalendarEventInteractions<Event, Resource>` | none | Adds raw event-root interactions after semantic behavior without replacing it. | `{ onContextMenu: openMenu }` |

Selection and opening gestures are invariant: an absent callback disables only
that semantic and never remaps its gesture. Event roots are focusable when a
semantic keyboard action or raw `onKeyDown` exists, but are not represented as
buttons.

### Event interaction context

<!-- api:CalendarEventOccurrence CalendarEventInteractionContext CalendarEventInteractions -->
<!-- props:CalendarEventOccurrence day resource resourceId -->
<!-- props:CalendarEventInteractionContext view occurrence -->
<!-- props:CalendarEventInteractions onClick onDoubleClick onContextMenu onKeyDown ariaKeyShortcuts -->

`CalendarEventInteractionContext<Resource>` identifies the view and the exact
rendered occurrence. Its `occurrence` contains normalized `day`, concrete
`resource` (or `null`), and stable `resourceId` (or `null`). This matters when
one source event appears on several days or resources.

Raw `onClick`, `onDoubleClick`, `onContextMenu`, and `onKeyDown` callbacks each
receive `(event, interaction, context)`. They observe the browser's real event
sequence: for example, a double-click produces two raw clicks and one raw
double-click while semantic selection runs once and semantic opening runs once.
`ariaKeyShortcuts` accepts a string or `(event, context) => string`; its tokens
are deduplicated with the built-in Space/Enter shortcuts.

Invalid event boundaries throw a contextual `TypeError`. Equal or reversed
event intervals throw `RangeError`; every event must satisfy `end > start`.

### Navigation boundaries

`minDate` and `maxDate` constrain navigation anchors, not rendered data. Each
value is normalized to the start of its calendar day in `timeZone`; the
interval is inclusive and `minDate` must not be after `maxDate`.

```tsx
<Calendar
    view="week"
    defaultDate="2026-09-17"
    minDate="2026-09-16"
    maxDate="2026-09-18"
    events={meetings}
/>
```

The week from September 14 through September 20 still renders in full. Because
it partially overlaps both boundaries, both outward navigation directions are
disabled. Boundaries never remove outside days or filter overlapping events.

A controlled `date` outside the interval is rendered unchanged. The direction
farther outside is disabled; the direction back toward the interval remains
available and its first navigation request is clamped directly to the nearest
boundary. The clamped `Date` is passed to `onDateChange`, so the application
must still update controlled state. Anchors produced by a range's custom
`navigation.resolveAnchor` strategy are validated and clamped by the same rule.

An invalid boundary throws a contextual `TypeError`. Supplying `minDate` after
`maxDate` throws `RangeError` during render.

## `AgendaView`

`AgendaView` groups each event under the first visible day it overlaps.
Multi-day events appear once. It accepts all shared props plus:

<!-- api:AgendaViewProps AgendaComponents AgendaDayHeaderProps AgendaEventProps AgendaEmptyProps -->
<!-- props:AgendaViewProps range weekStart components -->

| Prop | Type | Default | Meaning | Example |
| --- | --- | --- | --- | --- |
| `range` | `CalendarRangeDefinition` | `30` | Owns both the visible days and previous/next anchor behavior. | `14`, `"week"`, or `{ dayCount: 30, navigation: { stepDays: 30 } }` |
| `weekStart` | `CalendarWeekStart` | locale convention | Overrides the locale's first weekday for week definitions. | `1` for Monday |
| `components` | `AgendaComponents<Event>` | default renderers | Replaces agenda event, day header, empty state, or navigation renderers. | `{ event: AgendaEvent }` |

## `MonthView`

`MonthView` renders a complete week-aligned month grid. Each event appears on
every day it overlaps.

<!-- api:MonthViewProps MonthComponents MonthDayHeaderProps MonthEventProps -->
<!-- props:MonthViewProps weekStart showOutsideDays maxEventsPerDay selectedDate onSelectDay onShowMore components -->

| Prop | Type | Default | Meaning | Example |
| --- | --- | --- | --- | --- |
| `weekStart` | `CalendarWeekStart` | locale convention | First weekday used for headers and month boundaries. | `1` |
| `showOutsideDays` | `boolean` | `true` | Shows events in leading/trailing cells outside the active month. Cells and headings remain visible either way. | `false` |
| `maxEventsPerDay` | `number` | `4` | Maximum visible event rows before the overflow control. | `3` |
| `selectedDate` | `CalendarDateInput` | none | Visually marks one day after validation and wall-clock normalization in `timeZone`. State is application-owned. | `"2026-09-14"` |
| `onSelectDay` | `(day, interaction) => void` | none | Enables day-heading buttons and reports the normalized day. | `(day) => setSelectedDate(day)` |
| `onShowMore` | `({ day, events }, interaction) => void` | none | Enables the overflow limit and handles its control with all normalized events for that day. | `({ events }) => openList(events)` |
| `components` | `MonthComponents<Event>` | default renderers | Replaces event, day-header, or navigation renderers. | `{ dayHeader: MonthDay }` |

`maxEventsPerDay` must be a non-negative integer. It limits visible rows only
when `onShowMore` is provided; otherwise every event remains visible. Month
navigation always resolves the previous or next displayed month; custom range
navigation belongs only to configurable agenda and time-grid ranges.

## `DayView`, `WeekView`, and `TimeGridView`

All three accept `TimeGridViewProps<Event, Resource>`. `DayView` defaults to
`range="day"` and `viewName="day"`; the day preset moves one day. `WeekView`
defaults to `range="week"` and `viewName="week"`; the week preset moves seven
days. It also keeps day columns fluid down to `96px`, then scrolls horizontally.
An explicit `slotSizing.width` or `slotSizing.minWidth` overrides that minimum.
Explicit `range` values carry their own navigation. `TimeGridView` defaults to
the week preset and `viewName="time-grid"` without applying a column minimum.

<!-- api:TimeGridViewProps TimeGridGroupBy TimeGridMultiDayEventLayout TimeOfDay TimeGridSlotSizing -->
<!-- props:TimeGridViewProps resources groupBy multiDayEventLayout range weekStart minTime maxTime slotDuration resizeStep labelInterval slotSizing selectedRange canDragEvent onEventDrop canResizeEvent onEventResize onSlotSelect components -->

| Prop | Type | Default | Meaning | Example |
| --- | --- | --- | --- | --- |
| `resources` | `CalendarResourceConfig<Event, Resource>` | none | Creates one column per resource per visible day. | `{ items: rooms, getId: (room) => room.code }` |
| `groupBy` | `"day" \| "resource"` | `"day"` | Chooses the outer header/column grouping when resources exist. | `"resource"` |
| `multiDayEventLayout` | `"timed" \| "dedicated"` | `"timed"` | Keeps foreground events that cross local midnight in hourly slots or places them in a dedicated region above the hourly grid. | `"dedicated"` |
| `range` | `CalendarRangeDefinition` | `"week"` | Owns the days rendered by the grid and how previous/next resolves a new anchor. | `"day"`, `5`, or `{ dates, navigation }` |
| `weekStart` | `CalendarWeekStart` | locale convention | First day for `"week"` ranges. | `1` |
| `minTime` | `TimeOfDay` | `"00:00"` | Inclusive visible wall-clock start. | `"08:30"` |
| `maxTime` | `TimeOfDay \| "24:00"` | `"24:00"` | Exclusive visible wall-clock end. `24:00` is valid only here. | `"18:00"` |
| `slotDuration` | `number` | `60` | Positive integer minutes represented by one selectable slot. | `30` |
| `resizeStep` | `number` | `slotDuration` | Positive integer minutes between pointer, touch, and keyboard resize targets. Independent from visual slot size. | `15` |
| `labelInterval` | `number` | `slotDuration` | Label/divider cadence; must be an integer multiple of `slotDuration`. | `60` |
| `slotSizing` | `TimeGridSlotSizing` | fluid width (`WeekView`: `96px` minimum), fixed `50px` height | Fixed or minimum pixel dimension per slot axis. Fixed and minimum values on one axis are mutually exclusive. | `{ minWidth: 120, height: 48 }` |
| `selectedRange` | `CalendarSelectionRange` | none | Validates and normalizes the controlled half-open range in `timeZone`, then marks every overlapping slot. The end must follow the start. | `{ start: "2026-09-14T09:00:00", end: "2026-09-14T10:00:00" }` |
| `canDragEvent` | `(event, segment) => boolean` | allow all | Restricts pointer, touch, and keyboard movement from the event surface by source event and visible segment. Evaluated only when `onEventDrop` exists. | `(_, segment) => segment.resourceId !== "locked"` |
| `onEventDrop` | `(change: TimeGridEventDrop) => void` | none | Enables pointer/touch body dragging and focused-event keyboard movement, then reports one committed proposal. It does not mutate events. | `({ event, start, end }) => update(event.id, { start, end })` |
| `canResizeEvent` | `(event, segment, edge) => boolean` | allow all | Restricts a transparent start or end resize edge. Evaluated only when `onEventResize` exists. | `(_, segment) => segment.resourceId !== "locked"` |
| `onEventResize` | `(change: TimeGridEventResize) => void` | none | Enables pointer, touch, and keyboard edge resizing, updates event geometry live, and reports one committed proposal. | `({ event, start, end }) => update(event.id, { start, end })` |
| `onSlotSelect` | `(slot, interaction) => void` | none | Enables slot buttons, roving grid focus, and Arrow/Home/End/Page navigation, then reports the complete slot model on activation. | `(slot) => setRange({ start: slot.start, end: slot.end })` |
| `components` | `TimeGridComponents<Event, Resource>` | default renderers | Replaces event, slot, background, day header, resource header, or navigation renderers. | `{ event: ScheduleEvent }` |

`TimeOfDay` is strict zero-padded `HH:mm`. `minTime="24:00"` is invalid.
`TimeGridSlotSizing` supports `{ width }` or `{ minWidth }`, independently with
`{ height }` or `{ minHeight }`. Fixed values must be positive finite numbers;
minimum values may be zero.

Resizing changes one source boundary, retains the occurrence resource, and may
cross visible days on that resource. Targets follow the `resizeStep` scale
anchored to `minTime`; a shorter final interval ends exactly at `maxTime`.
The complete proposed event interval is previewed during movement. Pointer
release, Enter, or blur commits once after movement. Escape, pointer cancel,
and no movement produce no callback.

`multiDayEventLayout="dedicated"` derives placement exclusively from each
half-open `start`/`end` interval; it does not add event metadata. An event is
multi-day when it crosses a local calendar-day boundary, including overnight
events. Dedicated bars span contiguous visible day/resource columns and split
around unrelated resource columns. They retain selection/opening behavior,
move by visible day/resource columns, and resize in whole calendar-day steps.
Background events always remain in the hourly grid. The dedicated region is
omitted when no qualifying foreground event is visible.

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

## Time-grid interaction payloads

<!-- api:TimeGridColumn TimeGridSlot TimeGridEventSegment TimeGridEventPosition TimeGridEventDrop TimeGridEventResizeEdge TimeGridEventResize -->
<!-- props:TimeGridColumn day resource resourceId -->
<!-- props:TimeGridSlot start end duration day resource resourceId -->
<!-- props:TimeGridEventSegment layout start end day resource resourceId -->
<!-- props:TimeGridEventPosition day resource resourceId -->
<!-- props:TimeGridEventDrop event start end source destination -->
<!-- props:TimeGridEventResize event edge start end source -->

### `TimeGridColumn<Resource>`

| Field | Meaning | Example |
| --- | --- | --- |
| `day` | Normalized visible day represented by the column. | `new Date(2026, 8, 14)` |
| `resource` | Concrete resource item, or `null` when the grid has no resources. | `{ id: "studio", name: "Studio" }` |
| `resourceId` | Stable resource identity, or `null` without resources. | `"studio"` |

### `TimeGridSlot<Resource>`

| Field | Meaning | Example |
| --- | --- | --- |
| `start`, `end` | Half-open wall-clock interval. | `09:00` through `09:30` on the owning day |
| `duration` | Actual minutes; the last uneven slot may be shorter. | `30` |
| `day` | Normalized day owning the slot. | `new Date(2026, 8, 14)` |
| `resource` | Concrete resource item, or `null` without resources. | `{ id: "studio", name: "Studio" }` |
| `resourceId` | Stable resource identity, or `null` without resources. | `"studio"` |

### `TimeGridEventSegment<Resource>`

| Field | Meaning | Example |
| --- | --- | --- |
| `layout` | Region rendering the segment: `"timed"` for a single day/resource column or `"dedicated"` for an aligned multi-day bar. | `"dedicated"` |
| `start`, `end` | Visible half-open interval. Timed segments are clipped to one day and the time window; dedicated segments are clipped to their contiguous visible day span. | `new Date(2026, 8, 14, 14)` through `new Date(2026, 8, 16, 11)` |
| `day` | Normalized owning day for a timed segment or first visible day for a dedicated segment. | `new Date(2026, 8, 14)` |
| `resource` | Concrete resource column item, or `null` without resources. | `{ id: "studio", name: "Studio" }` |
| `resourceId` | Stable resource column identity, or `null` without resources. | `"studio"` |

The complete normalized source event is the separate `event` renderer/callback
argument. CSS rows, overlap lanes, generated keys, and flattened column indexes
are private; the library supplies their effect through `elementProps`.

### Export-surface migration

| Removed public contract | Replacement |
| --- | --- |
| `TimeGridEventLayout` and segment row/lane/index fields | Use `TimeGridEventSegment` for semantic interval/resource data and spread the positioned `elementProps` in renderers. |
| `TimeGridColumn.key`, `dayIndex`, and `resourceIndex` | Use `day`, `resource`, and `resourceId`; derive application-specific ordering from the `columns` array only when needed. |
| `TimeGridSlot.key`, indexes, and divider state | Use `start`, `end`, `duration`, `day`, `resource`, and `resourceId`; slot placement and classes remain library-owned. |
| `setDate` and `setTime` package exports | Pass `CalendarDateInput`, use the public normalization functions, or use the corresponding date-fns operation directly. |
| `createCalendarRange`, `getCalendarRangeBounds`, and `moveCalendarDate` package exports | Describe the range with `CalendarRangeDefinition`; call `resolveCalendarRange` when custom view code needs resolved days/navigation. |

### `TimeGridEventPosition<Resource>`

A shared `{ day, resource, resourceId }` position describes where movement or
resize originates and, for movement, where it lands.

### `TimeGridEventDrop<Event, Resource>`

`event` is the normalized source. `start` and `end` are proposed complete
boundaries. `source` and `destination` each contain `day`, concrete `resource`,
and `resourceId`:

```ts
{
    event: planning,
    start: new Date(2026, 8, 15, 11, 0),
    end: new Date(2026, 8, 15, 12, 15),
    source: { day: monday, resource: studio, resourceId: "studio" },
    destination: { day: tuesday, resource: workshop, resourceId: "workshop" }
}
```

### `TimeGridEventResize<Event, Resource>`

`edge` is `"start" | "end"`. `start` and `end` are the proposed complete
source boundaries. `source` identifies the rendered day/resource occurrence;
resizing never changes that resource.

```ts
{
    event: planning,
    edge: "end",
    start: new Date(2026, 8, 14, 9, 0),
    end: new Date(2026, 8, 14, 10, 30),
    source: { day: monday, resource: studio, resourceId: "studio" }
}
```

## Renderer contracts

Renderers receive prepared data and `elementProps`. Spread `elementProps` onto
the semantic root unchanged before adding application props. It carries class,
style, ARIA labeling, semantic/raw event handlers, and keyboard behavior owned
by the library.

<!-- api:CalendarRendererElementProps CalendarComponents CalendarNavigationButton CalendarNavigationButtonProps TimeGridComponents TimeGridSlotProps TimeGridEventProps TimeGridBackgroundEventProps TimeGridDayHeaderProps TimeGridResourceHeaderProps -->
<!-- props:CalendarRendererElementProps className style -->
<!-- props:CalendarComponents navigation -->
<!-- props:CalendarNavigationButtonProps type -->
<!-- props:TimeGridComponents event slot backgroundEvent dayHeader resourceHeader -->
<!-- props:TimeGridSlotProps slot selected elementProps -->
<!-- props:TimeGridEventProps event segment selected elementProps -->
<!-- props:TimeGridBackgroundEventProps event segment elementProps -->
<!-- props:TimeGridDayHeaderProps day columns title -->
<!-- props:TimeGridResourceHeaderProps resource resourceId columns title -->
<!-- props:AgendaComponents event dayHeader empty -->
<!-- props:AgendaDayHeaderProps day label -->
<!-- props:AgendaEventProps event timeLabel selected elementProps -->
<!-- props:AgendaEmptyProps message -->
<!-- props:MonthComponents event dayHeader -->
<!-- props:MonthDayHeaderProps day label outsideMonth -->
<!-- props:MonthEventProps event day timeLabel selected elementProps -->

`CalendarRendererElementProps` always includes `className` and `style`, and may
include native HTML attributes such as `title`, `aria-label`, `onClick`, and
`onKeyDown`. Foreground event renderers receive a localized `title` containing
the event title, description, and complete start/end date and time details.
For example, an interactive event may receive
`{ className: "calendar-event is-selected", style: { "--color": "#2563eb" },
"aria-label": "Planning, Monday, 9:00 AM to 10:00 AM", onClick }`.

| Renderer | Payload meaning | Example data |
| --- | --- | --- |
| shared `navigation` | Native button props plus `type: "prev" \| "next"`; preserve labels, disabled visibility, and click handlers. | `{ type: "next", "aria-label": "Next week", onClick }` |
| agenda `event` | Complete normalized `event`, prepared `timeLabel`, selection state, and root `elementProps`. | `{ event: planning, timeLabel: "9:00 AM – 10:00 AM", selected: true, elementProps }` |
| agenda `dayHeader` | Normalized `day` and prepared `label`. | `{ day: monday, label: "Monday, September 14" }` |
| agenda `empty` | Prepared empty-state message. | `{ message: "No events in this range." }` |
| month `event` | Complete normalized `event`, represented `day`, prepared `timeLabel`, selection state, and root props. | `{ event: planning, day: monday, timeLabel: "9:00 AM", selected: false, elementProps }` |
| month `dayHeader` | Normalized `day`, prepared `label`, and whether it lies outside the active month. | `{ day: monday, label: "14", outsideMonth: false }` |
| time-grid `event` | Complete normalized `event`, semantic visible `segment`, selection state, and positioned root props. | `{ event: planning, segment: { start: nine, end: ten, day: monday, resource: studio, resourceId: "studio" }, selected: true, elementProps }` |
| time-grid `slot` | Complete slot, range-overlap selection state, and root props. | `{ slot: { start: nine, end: nineThirty, duration: 30, resourceId: "studio" }, selected: false, elementProps }` |
| time-grid `backgroundEvent` | Complete normalized event, semantic visible segment, and non-interactive positioned root props. | `{ event: lunchClosure, segment: { start: noon, end: one, day: monday, resource: studio, resourceId: "studio" }, elementProps }` |
| time-grid `dayHeader` | Normalized `day`, covered semantic columns, and prepared string `title`. | `{ day: monday, columns: [{ day: monday, resource: studio, resourceId: "studio" }], title: "Mon 14" }` |
| time-grid `resourceHeader` | Concrete resource, its identity, covered semantic columns, and prepared React `title`. | `{ resource: studio, resourceId: "studio", columns: [studioColumn], title: "Studio" }` |

```tsx
import type { TimeGridEventProps } from "@chronolanejs/react";

function MeetingEvent({ event, segment, selected, elementProps }: TimeGridEventProps<Meeting, Room>) {
    return (
        <div
            {...elementProps}
            data-resource-id={segment.resourceId ?? undefined}
            data-selected={selected || undefined}
        >
            <strong>{event.title}</strong>
            <span>{event.owner.name}</span>
        </div>
    );
}
```

See [Accessibility](./accessibility.md#custom-renderer-responsibilities) before
replacing interactive renderers.

## Localization contracts

<!-- api:CalendarLocale DEFAULT_CALENDAR_LOCALE calendarLocaleNames CalendarFormatContext CalendarFormatters defaultCalendarFormatters CalendarMessageContext CalendarNavigationMessageContext CalendarSlotMessageContext CalendarEventMessageContext CalendarEventMoveHandleMessageContext CalendarEventMoveTargetMessageContext CalendarEventResizeHandleMessageContext CalendarTimeRangeMessageContext CalendarMoreEventsMessageContext CalendarMessages defaultCalendarMessages -->
<!-- props:CalendarFormatContext locale view -->
<!-- props:CalendarFormatters time date weekday dayHeader rangeHeader -->
<!-- props:CalendarMessageContext view -->
<!-- props:CalendarNavigationMessageContext range -->
<!-- props:CalendarSlotMessageContext date time -->
<!-- props:CalendarEventMessageContext title description startDate startTime endDate endTime -->
<!-- props:CalendarEventMoveHandleMessageContext title -->
<!-- props:CalendarEventMoveTargetMessageContext date time resource -->
<!-- props:CalendarEventResizeHandleMessageContext edge title date time -->
<!-- props:CalendarTimeRangeMessageContext startTime endTime -->
<!-- props:CalendarMoreEventsMessageContext count date -->
<!-- props:CalendarMessages previous next timeGridLabel multiDayRegionLabel monthGridLabel slotLabel eventLabel eventMoveHandle eventMoveTarget eventResizeHandle timeRange agendaEmpty moreEvents -->

`CalendarLocale` is a supported name or date-fns `Locale`. The constant
`DEFAULT_CALENDAR_LOCALE` is `"en-US"`. `calendarLocaleNames` is the frozen,
sorted list accepted by the built-in lazy registry.

### `CalendarFormatters`

Every callback receives `{ locale, view }`.

| Formatter | Input | Default result |
| --- | --- | --- |
| `time` | one date | locale short time (`9:00 AM`) |
| `date` | one date | locale full date |
| `weekday` | one date | abbreviated weekday |
| `dayHeader` | one date | view-specific day number/full date/weekday form |
| `rangeHeader` | resolved range | view-specific month, date, or date-span React content |

The registry is complete and immutable. Extend it outside render:

```tsx
const formatters = {
    ...defaultCalendarFormatters,
    time: (date: Date, { locale }: CalendarFormatContext) =>
        format(date, "HH:mm", { locale })
};
```

### `CalendarMessages`

| Message | Context fields | Purpose | Example result |
| --- | --- | --- | --- |
| `previous`, `next` | `view`, `range` | Navigation accessible label | `"Next week"` |
| `timeGridLabel`, `monthGridLabel` | `view` | Scrollable grid accessible name | `"Week calendar"` |
| `multiDayRegionLabel` | `view` | Visible and accessible dedicated-region label | `"Multi-day events"` |
| `slotLabel` | `view`, prepared `date`, prepared `time` | Selectable slot label | `"Monday, September 14 at 9:00 AM"` |
| `eventLabel` | `view`, optional title/description, prepared start/end date/time | Event details tooltip and interactive label | `"Planning, Monday, 9:00 AM to 10:00 AM"` |
| `eventMoveHandle` | `view`, optional title | Accessible movement description for a movable event | `"Move Planning"` |
| `eventMoveTarget` | `view`, optional title/resource, prepared date/time | Live movement destination announcement | `"Move Planning to Tuesday, 10:00 AM, Studio"` |
| `eventResizeHandle` | `view`, edge, optional title, prepared date/time | Accessible resize-handle label | `"Resize end of Planning, Monday at 10:00 AM"` |
| `timeRange` | `view`, prepared start/end time | Visible event time text | `"9:00 AM – 10:00 AM"` |
| `agendaEmpty` | `view`, `range` | Agenda empty state | `"No events in this range."` |
| `moreEvents` | `view`, `count`, prepared `date` | Month overflow control | `"Show 3 more events for September 14"` |

The default registry is immutable English application text. Locale-specific
date values are already prepared before message functions run.

## View definitions

<!-- api:CalendarViewDefinition defaultCalendarViews -->
<!-- props:CalendarViewDefinition component defaultProps -->

| `CalendarViewDefinition` field | Required | Meaning | Example |
| --- | --- | --- | --- |
| `component` | yes | React view component receiving its own props plus the shared view contract. | `QuarterView` |
| `defaultProps` | no | Partial defaults merged before explicit root and `viewProps` values. | `{ heading: "Quarter" }` |

`defaultCalendarViews` is the immutable built-in registry. A caller entry with
the same name overrides a built-in for that `Calendar`. The registry accepts
dynamic string lookup and returns a React element type when the name exists:

```ts
const viewName: string = getSavedViewName();
const BuiltInView = defaultCalendarViews[viewName];
```

## Date functions

<!-- api:parseCalendarDate asCalendarDate toCalendarTimeZone calendarDateFromTimestamp -->

| Function | Signature summary | Result and errors | Example |
| --- | --- | --- | --- |
| `parseCalendarDate` | `(CalendarDateInput) => Date` | Clones/parses; invalid input returns an invalid `Date`. | `parseCalendarDate("2026-09-14")` |
| `asCalendarDate` | `(input, timeZone?) => Date` | Parses, validates, and attaches a wall-clock zone. Throws `TypeError` when invalid. | `asCalendarDate("2026-09-14", "UTC")` |
| `toCalendarTimeZone` | `(date, timeZone?) => Date` | Attaches an IANA zone while preserving visible fields; does not preserve the instant. | `toCalendarTimeZone(new Date(2026, 8, 14, 9), "Asia/Tokyo")` |
| `calendarDateFromTimestamp` | `(milliseconds, timeZone?) => Date` | Preserves the instant and derives visible fields in the zone. | `calendarDateFromTimestamp(Date.now(), "UTC")` |

Field-level date setters are implementation details. Consumers should pass
`CalendarDateInput` values to components or use the normalization functions
above when a concrete calendar `Date` is required.

## Locale functions

<!-- api:resolveCalendarLocaleName loadCalendarLocale preloadCalendarLocale -->

| Function | Behavior | Errors | Example |
| --- | --- | --- | --- |
| `resolveCalendarLocaleName` | Canonicalizes aliases, scripts, regions, then language fallbacks to one registry key. | `TypeError` for empty/non-string; `RangeError` for invalid or unsupported names. | `resolveCalendarLocaleName("en") // "en-US"` |
| `loadCalendarLocale` | Loads and caches a supported named locale, or validates and resolves an object immediately. Concurrent loads share a promise. | `TypeError`, `RangeError`, or `Error` when dynamic import fails. | `await loadCalendarLocale("en-CA")` |
| `preloadCalendarLocale` | Alias of `loadCalendarLocale`, named for pre-render use. | same as above | `await preloadCalendarLocale("en-AU")` |

## Range function

<!-- api:resolveCalendarRange -->

| Function | Behavior | Errors | Example |
| --- | --- | --- | --- |
| `resolveCalendarRange` | Resolves days and navigation into one `ResolvedCalendarRange`. The result exposes `start`, `end`, `days`, and `navigate(direction)`. | `TypeError` for unsupported/ambiguous definitions or invalid custom navigation; `RangeError` for empty/invalid ranges or steps. | `resolveCalendarRange("week", anchor, { weekStartsOn: 1 })` |

Range construction, bounds extraction, and movement helpers stay private.
Consumers describe ranges with `CalendarRangeDefinition`; custom view code can
call `resolveCalendarRange` when it needs the normalized days and navigation
contract outside a built-in view.

## Error reference

| Area | Invalid input | Error |
| --- | --- | --- |
| Root view | unregistered `view` | `Error` |
| Dates/events | invalid date input or event boundary | `TypeError` |
| Navigation boundaries | invalid `minDate`/`maxDate`, or `minDate` after `maxDate` | `TypeError` or `RangeError` |
| Selection | invalid selected day/range boundary, or an end not after its start | `TypeError` or `RangeError` |
| Locale | empty/malformed object/name | `TypeError` or `RangeError` |
| Locale loading | failed dynamic module | `Error` with the original cause |
| Ranges | invalid/ambiguous definition, boundary, count, navigation strategy/result, direction, or empty result | `TypeError` or `RangeError` |
| Resources | missing/invalid/duplicate IDs or non-array assignments | `TypeError` or `RangeError` |
| Time window | malformed `HH:mm` or `maxTime <= minTime` | `TypeError` or `RangeError` |
| Time scale | non-positive slot duration or incompatible label interval | `RangeError` |
| Slot sizing | conflicting, non-finite, negative, or zero fixed size | `RangeError` |
| Grouping | value other than `day` or `resource` at runtime | `TypeError` |

Errors are raised during helper invocation or component render. Error messages
are useful diagnostics, but the error class and documented validity rules are
the stable contract.
