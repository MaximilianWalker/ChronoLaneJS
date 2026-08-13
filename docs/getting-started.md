# Getting started

This guide establishes the data and state contracts used by every built-in
view. See the [API reference](./api.md) for every prop and exported type.

## Install

The package is prepared for its first public release but is not published yet.
Once released, install it with its peer dependencies:

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
            timeZone="Europe/Lisbon"
            viewProps={{
                minTime: "08:00",
                maxTime: "18:00",
                slotDuration: 30,
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

## Time zones and date identity

`timeZone` applies one IANA zone to event boundaries, the anchor date, range
calculations, and callbacks. Inputs are interpreted as calendar fields in that
zone: attaching `Europe/Lisbon` to `09:00` keeps the wall clock at `09:00`.

```tsx
<Calendar
    date="2026-03-29"
    events={meetings}
    timeZone="Europe/Lisbon"
/>
```

Use `calendarDateFromTimestamp` when starting from an absolute timestamp and
you need its visible fields in a zone:

```tsx
import { calendarDateFromTimestamp } from "@chronolanejs/react";

const lisbonDate = calendarDateFromTimestamp(
    Date.parse("2026-09-14T08:00:00Z"),
    "Europe/Lisbon"
);
```

Date-only strings such as `2026-09-14` retain that calendar day instead of
being parsed as UTC midnight.

## Event identity in callbacks

Time-grid events may be clipped into visible day or resource segments. Public
selection and editing callbacks always receive the complete normalized source
event, including its original boundaries and application fields:

```tsx
<Calendar<Meeting>
    events={meetings}
    onEventSelect={(event, interaction) => {
        console.log(event.projectId);
        console.log(event.start, event.end); // complete normalized boundaries
        console.log(interaction.type);       // React synthetic event
    }}
    onEventEdit={(event) => openEditor(event)}
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
            days: 7,
            includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5,
            navigationStep: 7
        }
    }}
/>
```

Explicit non-contiguous days are supported:

```tsx
const visibleDays = [
    new Date(2026, 8, 14),
    new Date(2026, 8, 16),
    new Date(2026, 8, 18)
];

<Calendar view="time-grid" viewProps={{ range: visibleDays }} />
```

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

## Selection, editing, and dropping

Callback presence enables the associated interaction:

- `onEventSelect` enables primary click selection.
- `onEventEdit` enables double-click and keyboard editing.
- `onSlotSelect` enables time-grid slot selection.
- `onEventDrop` enables native time-grid dragging.

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
    viewProps={{
        onEventDrop: ({ event, start, end, destination }) => {
            setEvents((current) => current.map((item) => item.id === event.id
                ? {
                    ...item,
                    start,
                    end,
                    resourceId: destination.resourceId ?? undefined
                }
                : item));
        }
    }}
/>
```

Dragging a clipped multi-day segment preserves the complete source duration.
The drop payload includes concrete source and destination day/resource data.

## Localization

Named locales load lazily. `en-US` is synchronous; preload another locale when
it must render without a loading state:

```tsx
import {
    defaultCalendarMessages,
    preloadCalendarLocale
} from "@chronolanejs/react";

await preloadCalendarLocale("pt-PT");

const messages = {
    ...defaultCalendarMessages,
    previous: () => "Anterior",
    next: () => "Seguinte",
    agendaEmpty: () => "Sem eventos neste período."
};

<Calendar locale="pt-PT" messages={messages} events={meetings} />
```

`locale` formats dates and provides the default week start. Library-owned text
is controlled separately by the complete `messages` registry.

## Next references

- [Complete API reference](./api.md)
- [Styling and theming](./styling.md)
- [Runnable integration patterns](./examples.md)
- [Accessibility contract](./accessibility.md)
