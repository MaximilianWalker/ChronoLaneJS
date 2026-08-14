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
    timeZone="Europe/Lisbon"
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

`SharedViewProps<Event>` is accepted by every direct view. `Calendar` accepts
the same props except `viewName`, `className`, and `style`, which it owns at the
root.

<!-- api:SharedViewProps -->
<!-- props:SharedViewProps className style events backgroundEvents date defaultDate locale formatters messages viewName timeZone minDate maxDate showControls selectedEventIds canEditEvent onDateChange onRangeChange onEventSelect onEventEdit -->

| Prop | Type | Default | Meaning | Example |
| --- | --- | --- | --- | --- |
| `className` | `string` | none | Adds a class to the direct view root. | `"compact-agenda"` |
| `style` | `CalendarStyle` | none | Adds styles and calendar variables to the direct view root. | `{ height: 640 }` |
| `events` | `Event[]` | `[]` | Foreground events. Boundaries are normalized; extra fields are retained. | `[{ id: "a", start: "2026-09-14T09:00", end: "2026-09-14T10:00" }]` |
| `backgroundEvents` | `Event[]` | `[]` | Non-interactive availability/background regions. Agenda currently ignores them. | `[{ start: "2026-09-14T12:00", end: "2026-09-14T13:00", color: "#fee2e2" }]` |
| `date` | `CalendarDateInput` | none | Controlled navigation anchor. | `"2026-09-14"` |
| `defaultDate` | `CalendarDateInput` | current time | Initial uncontrolled anchor; ignored when `date` is supplied. | `new Date(2026, 8, 14)` |
| `locale` | `CalendarLocale` | `"en-US"` | date-fns locale object or supported BCP 47-style name. Named non-default locales may suspend. | `"pt-PT"` |
| `formatters` | `CalendarFormatters` | `defaultCalendarFormatters` | Complete registry for calendar-owned date/time rendering. | `{ ...defaultCalendarFormatters, time: customTime }` |
| `messages` | `CalendarMessages` | `defaultCalendarMessages` | Complete registry for visible and accessible library text. | `{ ...defaultCalendarMessages, next: () => "Seguinte" }` |
| `viewName` | `string` | view-specific | Identity supplied to formatter/message contexts. Normally set only on a direct view or custom wrapper. | `"work-week"` |
| `timeZone` | `string` | host local zone | IANA zone used for calendar-field normalization and arithmetic. | `"Europe/Lisbon"` |
| `minDate` | `CalendarDateInput \| null` | `null` | Inclusive earliest navigation day. Previous navigation is disabled when the anchor or active period reaches/crosses it; visible days and events are not filtered. | `"2026-01-01"` |
| `maxDate` | `CalendarDateInput \| null` | `null` | Inclusive latest navigation day. Next navigation is disabled when the anchor or active period reaches/crosses it; visible days and events are not filtered. | `"2026-12-31"` |
| `showControls` | `boolean` | `true` | Shows the built-in range header and navigation controls. | `false` |
| `selectedEventIds` | `CalendarEventId[]` | `[]` | Marks matching event renderers selected. The library does not update the collection. | `["planning", 42]` |
| `canEditEvent` | `(event) => boolean` | allow all | Restricts `onEventEdit` for individual normalized source events. | `(event) => event.owner.id === user.id` |
| `onDateChange` | `(date: Date) => void` | none | Fires after navigation requests a normalized anchor, in controlled and uncontrolled modes. | `setDate` |
| `onRangeChange` | `(range: CalendarRange) => void` | none | Fires after the visible range resolves. Month payloads also carry `monthStart` and `monthEnd`. | `({ days }) => fetchDays(days)` |
| `onEventSelect` | `(event, interaction) => void` | none | Enables primary event selection and receives the complete normalized source event. | `(event) => setSelected([event.id!])` |
| `onEventEdit` | `(event, interaction) => void` | none | Enables double-click and keyboard editing for allowed events. | `(event) => openEditor(event)` |

Invalid date inputs throw `TypeError: Calendar dates must be valid.` Event
normalization currently validates each boundary but does not reject reversed
event ranges; consumers should supply `end > start`.

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
| `onShowMore` | `({ day, events }, interaction) => void` | none | Handles the overflow control with all hidden normalized events for that day. | `({ events }) => openList(events)` |
| `components` | `MonthComponents<Event>` | default renderers | Replaces event, day-header, or navigation renderers. | `{ dayHeader: MonthDay }` |

`maxEventsPerDay` is used as an array slice boundary; use a non-negative integer
for deterministic results. Month navigation always resolves the previous or
next displayed month; custom range navigation belongs only to configurable
agenda and time-grid ranges.

## `DayView`, `WeekView`, and `TimeGridView`

All three accept `TimeGridViewProps<Event, Resource>`. `DayView` defaults to
`range="day"` and `viewName="day"`; the day preset moves one day. `WeekView`
defaults to `range="week"` and `viewName="week"`; the week preset moves seven
days. Explicit `range` values carry their own navigation. `TimeGridView`
defaults to the week preset and `viewName="time-grid"`.

<!-- api:TimeGridViewProps TimeGridGroupBy TimeOfDay TimeGridSlotSizing -->
<!-- props:TimeGridViewProps resources groupBy range weekStart minTime maxTime slotDuration labelInterval slotSizing selectedRange canDragEvent onEventDrop onSlotSelect components -->

| Prop | Type | Default | Meaning | Example |
| --- | --- | --- | --- | --- |
| `resources` | `CalendarResourceConfig<Event, Resource>` | none | Creates one column per resource per visible day. | `{ items: rooms, getId: (room) => room.code }` |
| `groupBy` | `"day" \| "resource"` | `"day"` | Chooses the outer header/column grouping when resources exist. | `"resource"` |
| `range` | `CalendarRangeDefinition` | `"week"` | Owns the days rendered by the grid and how previous/next resolves a new anchor. | `"day"`, `5`, or `{ dates, navigation }` |
| `weekStart` | `CalendarWeekStart` | locale convention | First day for `"week"` ranges. | `1` |
| `minTime` | `TimeOfDay` | `"00:00"` | Inclusive visible wall-clock start. | `"08:30"` |
| `maxTime` | `TimeOfDay \| "24:00"` | `"24:00"` | Exclusive visible wall-clock end. `24:00` is valid only here. | `"18:00"` |
| `slotDuration` | `number` | `60` | Positive integer minutes represented by one selectable slot. | `30` |
| `labelInterval` | `number` | `slotDuration` | Label/divider cadence; must be an integer multiple of `slotDuration`. | `60` |
| `slotSizing` | `TimeGridSlotSizing` | fluid width, fixed `50px` height | Fixed or minimum pixel dimension per slot axis. Fixed and minimum values on one axis are mutually exclusive. | `{ minWidth: 120, height: 48 }` |
| `selectedRange` | `CalendarSelectionRange` | none | Validates and normalizes the controlled half-open range in `timeZone`, then marks every overlapping slot. The end must follow the start. | `{ start: "2026-09-14T09:00:00", end: "2026-09-14T10:00:00" }` |
| `canDragEvent` | `(event, segment) => boolean` | allow all | Restricts native dragging by source event and visible segment. Evaluated only when `onEventDrop` exists. | `(_, segment) => segment.resourceId !== "locked"` |
| `onEventDrop` | `(change: TimeGridEventDrop) => void` | none | Enables native dragging and reports the proposed complete move. It does not mutate events. | `({ event, start, end }) => update(event.id, { start, end })` |
| `onSlotSelect` | `(slot, interaction) => void` | none | Enables slot buttons and reports the complete slot model. | `(slot) => setRange({ start: slot.start, end: slot.end })` |
| `components` | `TimeGridComponents<Event, Resource>` | default renderers | Replaces event, slot, background, day header, resource header, or navigation renderers. | `{ event: ScheduleEvent }` |

`TimeOfDay` is strict zero-padded `HH:mm`. `minTime="24:00"` is invalid.
`TimeGridSlotSizing` supports `{ width }` or `{ minWidth }`, independently with
`{ height }` or `{ minHeight }`. Fixed values must be positive finite numbers;
minimum values may be zero.

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

## Interaction and drop payloads

<!-- api:TimeGridColumn TimeGridSlot TimeGridEventSegment TimeGridEventLayout TimeGridEventDropPosition TimeGridEventDrop -->
<!-- props:TimeGridColumn key day dayIndex resource resourceId resourceIndex -->
<!-- props:TimeGridSlot key start end duration timeIndex day dayIndex columnIndex resource resourceId isDividerBoundary -->
<!-- props:TimeGridEventDropPosition day resource resourceId -->
<!-- props:TimeGridEventDrop event start end source destination -->

### `TimeGridColumn<Resource>`

| Field | Meaning | Example |
| --- | --- | --- |
| `key` | Stable internal key for the visible day/resource combination. | `"2026-09-14::studio"` |
| `day`, `dayIndex` | Normalized visible day and its zero-based range index. | `new Date(2026, 8, 14)`, `0` |
| `resource`, `resourceId`, `resourceIndex` | Concrete resource data and identity, or `null` when resources are absent. | `{ id: "studio", name: "Studio" }`, `"studio"`, `0` |

### `TimeGridSlot<Resource>`

| Field | Meaning | Example |
| --- | --- | --- |
| `key` | Stable key for the slot/column pair. | `"2026-09-14::studio::2"` |
| `start`, `end` | Half-open wall-clock interval. | `09:00` through `09:30` on the owning day |
| `duration` | Actual minutes; the last uneven slot may be shorter. | `30` |
| `timeIndex` | Zero-based vertical slot index. | `2` |
| `day`, `dayIndex` | Owning normalized day and its range index. | `new Date(2026, 8, 14)`, `0` |
| `columnIndex` | Zero-based flattened day/resource column index. | `1` |
| `resource`, `resourceId` | Concrete resource assignment and identity, or `null`. | `{ id: "studio" }`, `"studio"` |
| `isDividerBoundary` | Whether a major label divider follows this slot. | `true` at an hourly boundary |

### `TimeGridEventSegment` and `TimeGridEventLayout`

A segment contains the visible clipped boundary plus `event` (the complete
source), day/column/resource context, and one-based CSS `startRow`/`endRow`.
`TimeGridEventLayout` adds `laneIndex` and `laneCount` for overlaps. Consumers
normally read these through renderer payloads rather than constructing them.

### `TimeGridEventDrop`

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

## Renderer contracts

Renderers receive prepared data and `elementProps`. Spread `elementProps` onto
the semantic root unchanged before adding application props. It carries class,
style, ARIA labeling, selection/editing handlers, drag handlers, and keyboard
behavior owned by the library.

<!-- api:CalendarRendererElementProps CalendarComponents CalendarNavigationButton CalendarNavigationButtonProps TimeGridComponents TimeGridSlotProps TimeGridEventProps TimeGridBackgroundEventProps TimeGridDayHeaderProps TimeGridResourceHeaderProps -->
<!-- props:CalendarRendererElementProps className style -->
<!-- props:CalendarComponents navigation -->
<!-- props:CalendarNavigationButtonProps type -->
<!-- props:TimeGridComponents event slot backgroundEvent dayHeader resourceHeader -->
<!-- props:TimeGridSlotProps slot selected elementProps -->
<!-- props:TimeGridEventProps event segment selected elementProps -->
<!-- props:TimeGridBackgroundEventProps event segment elementProps -->
<!-- props:TimeGridDayHeaderProps day dayIndex columns title -->
<!-- props:TimeGridResourceHeaderProps resource resourceId resourceIndex columns title -->
<!-- props:AgendaComponents event dayHeader empty -->
<!-- props:AgendaDayHeaderProps day label -->
<!-- props:AgendaEventProps event timeLabel selected elementProps -->
<!-- props:AgendaEmptyProps message -->
<!-- props:MonthComponents event dayHeader -->
<!-- props:MonthDayHeaderProps day label outsideMonth -->
<!-- props:MonthEventProps event day timeLabel selected elementProps -->

`CalendarRendererElementProps` always includes `className` and `style`, and may
include native HTML attributes such as `aria-label`, `onClick`, `onKeyDown`,
`draggable`, and drag handlers. For example, an interactive event may receive
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
| time-grid `event` | Complete normalized `event`, visible positioned `segment`, selection state, and root props. | `{ event: planning, segment: { dayIndex: 0, startRow: 3, endRow: 5, laneIndex: 0, laneCount: 2 }, selected: true, elementProps }` |
| time-grid `slot` | Complete slot, range-overlap selection state, and root props. | `{ slot: { start: nine, end: nineThirty, duration: 30, resourceId: "studio" }, selected: false, elementProps }` |
| time-grid `backgroundEvent` | Complete normalized event, visible segment, and non-interactive root props. | `{ event: lunchClosure, segment: { dayIndex: 0, startRow: 9, endRow: 11 }, elementProps }` |
| time-grid `dayHeader` | Normalized `day`, zero-based `dayIndex`, covered columns, and prepared string `title`. | `{ day: monday, dayIndex: 0, columns: [studioColumn], title: "Mon 14" }` |
| time-grid `resourceHeader` | Concrete resource, identity/index, covered columns, and prepared React `title`. | `{ resource: studio, resourceId: "studio", resourceIndex: 0, columns: [studioColumn], title: "Studio" }` |

```tsx
import type { TimeGridEventProps } from "@chronolanejs/react";

function MeetingEvent({ event, segment, selected, elementProps }: TimeGridEventProps<Meeting, Room>) {
    const interactive = Boolean(elementProps.onClick || elementProps.onDoubleClick);
    const Root = interactive ? "button" : "div";

    return (
        <Root
            {...elementProps}
            type={interactive ? "button" : undefined}
            data-day-index={segment.dayIndex}
            aria-pressed={interactive ? selected : undefined}
        >
            <strong>{event.title}</strong>
            <span>{event.owner.name}</span>
        </Root>
    );
}
```

See [Accessibility](./accessibility.md#custom-renderer-responsibilities) before
replacing interactive renderers.

## Localization contracts

<!-- api:CalendarLocale DEFAULT_CALENDAR_LOCALE calendarLocaleNames CalendarFormatContext CalendarFormatters defaultCalendarFormatters CalendarMessageContext CalendarNavigationMessageContext CalendarSlotMessageContext CalendarEventMessageContext CalendarTimeRangeMessageContext CalendarMoreEventsMessageContext CalendarMessages defaultCalendarMessages -->
<!-- props:CalendarFormatContext locale view -->
<!-- props:CalendarFormatters time date weekday dayHeader rangeHeader -->
<!-- props:CalendarMessageContext view -->
<!-- props:CalendarNavigationMessageContext range -->
<!-- props:CalendarSlotMessageContext date time -->
<!-- props:CalendarEventMessageContext title description startDate startTime endDate endTime -->
<!-- props:CalendarTimeRangeMessageContext startTime endTime -->
<!-- props:CalendarMoreEventsMessageContext count date -->
<!-- props:CalendarMessages previous next timeGridLabel monthGridLabel slotLabel eventLabel timeRange agendaEmpty moreEvents -->

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
| `slotLabel` | `view`, prepared `date`, prepared `time` | Selectable slot label | `"Monday, September 14 at 9:00 AM"` |
| `eventLabel` | `view`, optional title/description, prepared start/end date/time | Interactive event label | `"Planning, Monday, 9:00 AM to 10:00 AM"` |
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
the same name overrides a built-in for that `Calendar`.

## Date functions

<!-- api:parseCalendarDate asCalendarDate toCalendarTimeZone calendarDateFromTimestamp setDate setTime -->

| Function | Signature summary | Result and errors | Example |
| --- | --- | --- | --- |
| `parseCalendarDate` | `(CalendarDateInput) => Date` | Clones/parses; invalid input returns an invalid `Date`. | `parseCalendarDate("2026-09-14")` |
| `asCalendarDate` | `(input, timeZone?) => Date` | Parses, validates, and attaches a wall-clock zone. Throws `TypeError` when invalid. | `asCalendarDate("2026-09-14", "Europe/Lisbon")` |
| `toCalendarTimeZone` | `(date, timeZone?) => Date` | Attaches an IANA zone while preserving visible fields; does not preserve the instant. | `toCalendarTimeZone(new Date(2026, 8, 14, 9), "Asia/Tokyo")` |
| `calendarDateFromTimestamp` | `(milliseconds, timeZone?) => Date` | Preserves the instant and derives visible fields in the zone. | `calendarDateFromTimestamp(Date.now(), "UTC")` |
| `setDate` | `(time, year=1970, month=0, day=1) => Date` | Replaces calendar fields without mutation. Month is zero-based. | `setDate(time, 2026, 8, 14)` |
| `setTime` | `(date, hours=0, minutes=0, seconds=0, milliseconds=0) => Date` | Replaces time fields without mutation. | `setTime(day, 9, 30)` |

## Locale functions

<!-- api:resolveCalendarLocaleName loadCalendarLocale preloadCalendarLocale -->

| Function | Behavior | Errors | Example |
| --- | --- | --- | --- |
| `resolveCalendarLocaleName` | Canonicalizes aliases, scripts, regions, then language fallbacks to one registry key. | `TypeError` for empty/non-string; `RangeError` for invalid or unsupported names. | `resolveCalendarLocaleName("pt-PT") // "pt"` |
| `loadCalendarLocale` | Loads and caches a supported named locale, or validates and resolves an object immediately. Concurrent loads share a promise. | `TypeError`, `RangeError`, or `Error` when dynamic import fails. | `await loadCalendarLocale("fr-FR")` |
| `preloadCalendarLocale` | Alias of `loadCalendarLocale`, named for pre-render use. | same as above | `await preloadCalendarLocale("ja-JP")` |

## Range functions

<!-- api:createCalendarRange resolveCalendarRange getCalendarRangeBounds moveCalendarDate -->

| Function | Behavior | Errors | Example |
| --- | --- | --- | --- |
| `createCalendarRange` | Creates inclusive normalized days from valid `start` plus `end` or positive `dayCount`, then optionally filters. | `TypeError` for invalid boundaries; `RangeError` for invalid count/reversed range. | `createCalendarRange({ start, dayCount: 5 })` |
| `resolveCalendarRange` | Resolves days and navigation into one `ResolvedCalendarRange`. The result exposes `start`, `end`, `days`, and `navigate(direction)`. | `TypeError` for unsupported/ambiguous definitions or invalid custom navigation; `RangeError` for empty/invalid ranges or steps. | `resolveCalendarRange("week", anchor, { weekStartsOn: 1 })` |
| `getCalendarRangeBounds` | Returns first/last dates from a non-empty resolved array. | `RangeError` when empty. | `getCalendarRangeBounds(days)` |
| `moveCalendarDate` | Adds positive integer days in direction `-1` or `1`. | `RangeError` for another direction or invalid step. | `moveCalendarDate(date, 1, 7)` |

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
