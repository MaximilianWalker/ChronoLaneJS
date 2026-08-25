# Calendar and views

This reference covers the root calendar, shared behavior, built-in views, and
custom view registration. Start with the [API overview](../api.md) to find
another contract area.

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
buttons. See [Interactions and callbacks](./interactions-callbacks.md#event-interaction-context)
for the occurrence context and raw interaction contract.

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
