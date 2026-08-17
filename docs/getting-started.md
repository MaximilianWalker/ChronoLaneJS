# Getting started

This guide establishes the data and state contracts used by every built-in
view. See the [API reference](./api.md) for every prop and exported type.

## Install

Install the published package with its peer dependencies:

```bash
npm install @chronolanejs/react react react-dom date-fns @date-fns/tz
```

Import the stylesheet once at the application entry point:

```tsx
import "@chronolanejs/react/styles.css";
```

The supported Node, React, and browser versions are listed in the
[repository overview](../README.md#runtime-support).

## Define event data

ChronoLaneJS accepts application event types that extend `CalendarEvent`.
`start` and `end` may be a `Date`, a timestamp, or a date string. An `id` is
optional for display, but required to use `selectedEventIds` reliably.

```tsx
import type { CalendarEvent } from "@chronolanejs/react";

interface Meeting extends CalendarEvent {
    id: string;
    projectId: string;
    owner: { id: string; name: string };
}

const meetings: Meeting[] = [{
    id: "planning",
    projectId: "chrono",
    owner: { id: "ava", name: "Ava" },
    title: "Planning",
    description: "Set priorities for the week",
    start: "2026-09-14T09:00:00",
    end: "2026-09-14T10:15:00",
    color: "#2563eb"
}];
```

Events are shallow-copied and their boundaries are normalized to valid `Date`
objects. Extra application fields remain available in callbacks and custom
renderers.

## Render a view

`Calendar` defaults to the week view. Shared behavior stays at the root;
configuration owned by the selected view belongs in `viewProps`.

```tsx
import Calendar from "@chronolanejs/react";

export function Schedule() {
    return (
        <Calendar<Meeting>
            events={meetings}
            defaultDate="2026-09-14"
            timeZone="UTC"
            viewProps={{
                minTime: "08:00",
                maxTime: "18:00",
                slotDuration: 30,
                resizeStep: 15,
                labelInterval: 60
            }}
        />
    );
}
```

Built-in view names are `agenda`, `day`, `month`, `time-grid`, and `week`.
`day` and `week` are presets over the same time-grid engine. The generic
`time-grid` view accepts arbitrary ranges.

## Controlled and uncontrolled dates

Use `defaultDate` for an initial uncontrolled anchor. Navigation updates the
view internally and still calls `onDateChange`.

```tsx
<Calendar
    defaultDate="2026-09-14"
    onDateChange={(date) => console.log(date.toISOString())}
/>
```

Use `date` for controlled navigation. Update it when `onDateChange` fires:

```tsx
import { useState } from "react";
import type { CalendarDateInput } from "@chronolanejs/react";

export function ControlledSchedule() {
    const [date, setDate] = useState<CalendarDateInput>("2026-09-14");

    return (
        <Calendar
            date={date}
            onDateChange={setDate}
            events={meetings}
        />
    );
}
```

When both are supplied, `date` controls the view and `defaultDate` is ignored.
Without either prop, the initial anchor is the current time.

### Bound navigation

Use `minDate` and `maxDate` to define an inclusive navigation interval:

```tsx
const [date, setDate] = useState<CalendarDateInput>("2026-09-14");

<Calendar
    date={date}
    minDate="2026-09-01"
    maxDate="2026-09-30"
    onDateChange={setDate}
    events={meetings}
/>
```

The boundaries are calendar days in `timeZone`. They disable movement farther
outside the interval but do not clip the visible range or filter events. A
week or agenda range that partially overlaps a boundary stays intact and its
outward navigation direction is disabled.

If a controlled `date` is already outside the interval, ChronoLaneJS keeps
rendering that supplied value. Only navigation toward the interval remains
available, and the first request is clamped directly to the nearest boundary.
Update the controlled value from `onDateChange` as usual. Invalid boundaries
throw `TypeError`; `minDate` after `maxDate` throws `RangeError`.

## Time zones and date identity

`timeZone` applies one IANA zone to event boundaries, the anchor date, range
calculations, and callbacks. Inputs are interpreted as calendar fields in that
zone: attaching `America/New_York` to `09:00` keeps the wall clock at `09:00`.

```tsx
<Calendar
    date="2026-03-08"
    events={meetings}
    timeZone="America/New_York"
/>
```

Use `calendarDateFromTimestamp` when starting from an absolute timestamp and
you need its visible fields in a zone:

```tsx
import { calendarDateFromTimestamp } from "@chronolanejs/react";

const newYorkDate = calendarDateFromTimestamp(
    Date.parse("2026-09-14T13:00:00Z"),
    "America/New_York"
);
```

Date-only strings such as `2026-09-14` retain that calendar day instead of
being parsed as UTC midnight.

## Event identity in callbacks

Time-grid events may be clipped into visible day or resource segments. Public
selection and opening callbacks always receive the complete normalized source
event plus the occurrence that was used:

```tsx
<Calendar<Meeting>
    events={meetings}
    onEventSelect={(event, interaction, context) => {
        console.log(event.projectId);
        console.log(event.start, event.end); // complete normalized boundaries
        console.log(interaction.type);       // React synthetic event
        console.log(context.view, context.occurrence.resourceId);
    }}
    onEventOpen={(event) => openEditor(event)}
/>
```

Custom time-grid event renderers receive both `event` (the complete source)
and `segment` (the visible positioned portion). Use `event` for application
state and `segment` only for visible layout context.

## Ranges and navigation

Time-grid and agenda ranges accept presets, counts, explicit days, options, or
an anchor-aware callback:

```tsx
import { startOfWeek } from "date-fns/startOfWeek";

<Calendar
    view="time-grid"
    viewProps={{
        range: {
            start: (anchor, { weekStartsOn }) => startOfWeek(anchor, {
                weekStartsOn
            }),
            dayCount: 7,
            includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5,
            navigation: { stepDays: 7 }
        }
    }}
/>
```

The range definition owns both the visible days and navigation. `stepDays`
expresses ordinary calendar-day movement; use `resolveAnchor` when the next
anchor follows domain-specific rules.

Explicit non-contiguous days can carry the same navigation strategy:

```tsx
import { addDays } from "date-fns/addDays";

<Calendar
    view="time-grid"
    viewProps={{
        range: {
            dates: (anchor) => [
                anchor,
                addDays(anchor, 2),
                addDays(anchor, 4)
            ],
            navigation: { stepDays: 7 }
        }
    }}
/>
```

The shorthand presets own matching defaults: `"day"` moves one day, `"week"`
moves seven, and a numeric range moves by its count. A callback can return any
definition above, including its `navigation`; resolution keeps the two
together. A literal `Date[]` is an absolute, fixed range. Hide controls for a
fixed range, or use anchor-aware `dates` as above when it should navigate.

`onRangeChange` receives normalized `start`, `end`, and `days` after every
resolved range change.

## Resources

Resources add columns to any time-grid range. By convention an object resource
uses `id` and `title` or `name`; accessors support any model.

```tsx
interface Room {
    code: number;
    label: string;
}

const rooms: Room[] = [
    { code: 101, label: "Studio" },
    { code: 202, label: "Workshop" }
];

const roomEvents: Meeting[] = [{
    ...meetings[0],
    resourceIds: [101, 202]
}];

<Calendar<Meeting, Room>
    view="week"
    events={roomEvents}
    viewProps={{
        resources: {
            items: rooms,
            getId: (room) => room.code,
            getTitle: (room) => room.label,
            getEventIds: (event) => event.resourceIds ?? []
        },
        groupBy: "resource"
    }}
/>
```

Resource IDs compare by JavaScript `Map`/`Set` equality. Strings and numbers
are distinct, so `101` does not match `"101"`. Missing, empty, non-finite, or
duplicate IDs throw during rendering.

## Selection, opening, resizing, and moving

Callback presence enables the associated semantic without changing its gesture:

- `onEventSelect` enables selection by single click or Space.
- `onEventOpen` enables opening by double-click, double-tap, or Enter.
- `onSlotSelect` enables time-grid slot selection.
- `onEventDrop` enables time-grid movement by pointer, touch, or keyboard.
- `onEventResize` enables time-grid start/end resizing by pointer, touch, or
  keyboard. Targets follow `resizeStep`, which defaults to `slotDuration` but
  may provide finer precision than the visual slots.

Set `multiDayEventLayout: "dedicated"` to move foreground events that cross
local midnight into a compact region above the hourly slots. The default
`"timed"` behavior is unchanged. Placement is derived from the event's
half-open `start`/`end` interval; there is no separate all-day flag, and
background events remain in the hourly grid.

`eventInteractions` may add raw click, double-click, context-menu, and key-down
callbacks. They are composed after the semantic behavior rather than replacing
it. `canSelectEvent` and `canOpenEvent` restrict one semantic action for one
rendered occurrence; view-specific predicates restrict movement and resize.

State remains application-owned:

```tsx
const [selectedEventIds, setSelectedEventIds] = useState<Array<string | number>>([]);
const [events, setEvents] = useState(meetings);

<Calendar<Meeting>
    events={events}
    selectedEventIds={selectedEventIds}
    onEventSelect={(event) => {
        if (event.id != null) setSelectedEventIds([event.id]);
    }}
    onEventOpen={(event) => setEditorEvent(event)}
    eventInteractions={{
        onContextMenu: (event, interaction) => {
            interaction.preventDefault();
            openEventMenu(event, interaction.clientX, interaction.clientY);
        }
    }}
    viewProps={{
        resizeStep: 15,
        onEventDrop: ({ event, start, end, destination }) => {
            setEvents((current) => current.map((item) => item.id === event.id
                ? {
                    ...item,
                    start,
                    end,
                    resourceId: destination.resourceId ?? undefined
                }
                : item));
        },
        onEventResize: ({ event, start, end }) => {
            setEvents((current) => current.map((item) => item.id === event.id
                ? { ...item, start, end }
                : item));
        }
    }}
/>
```

Move handles use Arrow Up/Down for adjacent time slots and Arrow Left/Right for
adjacent day/resource columns. Resize handles use Arrow keys for the adjacent
`resizeStep` boundary. Both interactions preview the complete proposal, use
Enter or blur to commit, and use Escape to cancel. Pointer, touch, and keyboard
share the same targets and fire the application callback only once on commit.
A no-op move or resize does not fire a callback.

Dedicated multi-day handles use Left/Right for visible day/resource movement
and whole-calendar-day resizing. Wall-clock times remain stable across DST.

`selectedDate` and both `CalendarSelectionRange` boundaries accept the same
`Date`, string, and timestamp inputs as events. The view clones and validates
them, then applies `timeZone` with the same wall-clock semantics used for
events and the navigation date:

```tsx
<Calendar
    view="day"
    timeZone="UTC"
    viewProps={{
        selectedRange: {
            start: "2026-09-14T09:00:00",
            end: "2026-09-14T10:30:00"
        }
    }}
/>
```

Selection ranges are half-open (`[start,end)`) and must have a positive
duration. Invalid boundaries throw `TypeError`; equal or reversed boundaries
throw `RangeError`. Selection remains controlled—the library never rewrites
the supplied values.

Moving a clipped multi-day segment preserves the complete source duration.
The movement payload includes concrete source and destination day/resource data.

## Localization

Named locales load lazily. `en-US` is synchronous; preload another locale when
it must render without a loading state:

```tsx
import {
    defaultCalendarMessages,
    preloadCalendarLocale
} from "@chronolanejs/react";

await preloadCalendarLocale("en-GB");

const messages = {
    ...defaultCalendarMessages,
    previous: () => "Previous period",
    next: () => "Next period",
    agendaEmpty: () => "No events in this period."
};

<Calendar locale="en-GB" messages={messages} events={meetings} />
```

`locale` formats dates and provides the default week start. Library-owned text
is controlled separately by the complete `messages` registry.

## Next references

- [Complete API reference](./api.md)
- [Styling and theming](./styling.md)
- [Runnable integration patterns](./examples.md)
- [Accessibility contract](./accessibility.md)
