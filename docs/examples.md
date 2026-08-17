# Examples

The repository contains two runnable consumer applications. The
[`examples` directory](../examples/) also provides a command-oriented index.

- [`examples/vite`](../examples/vite/) demonstrates a client-rendered Vite app
  with controlled navigation, resources, localization, a custom event
  renderer, selection, opening, slot selection, resizing, and event-drop state
  updates.
- [`examples/next`](../examples/next/) demonstrates the App Router boundary:
  CSS in the server layout and interactive calendar state in a client
  component.

From a repository checkout, build the package first, then run either example:

```bash
npm run build

npm install --prefix examples/vite
npm run dev --prefix examples/vite

npm install --prefix examples/next
npm run dev --prefix examples/next
```

Both examples use `file:../..` for their interactive local-development
workflow. `npm run examples:check` instead creates one package tarball and
installs that exact artifact into temporary clean copies before type-checking
and production-building both consumers.

## Minimal Vite integration

Import the stylesheet and render into the application root:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Calendar from "@chronolanejs/react";
import "@chronolanejs/react/styles.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Calendar
            defaultDate="2026-09-14"
            events={[{
                id: "planning",
                title: "Planning",
                start: "2026-09-14T09:00:00",
                end: "2026-09-14T10:00:00"
            }]}
        />
    </StrictMode>
);
```

The full implementation is in [`examples/vite/src/App.tsx`](../examples/vite/src/App.tsx).

## Minimal Next.js App Router integration

Import the global stylesheet from the server layout:

```tsx
// app/layout.tsx
import "@chronolanejs/react/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <html lang="en"><body>{children}</body></html>;
}
```

Keep state and callbacks behind a client boundary:

```tsx
// app/Schedule.tsx
"use client";

import { useState } from "react";
import Calendar from "@chronolanejs/react";

export default function Schedule() {
    const [date, setDate] = useState("2026-09-14");

    return (
        <Calendar
            date={date}
            onDateChange={setDate}
            events={[]}
        />
    );
}
```

The package entry already includes `"use client"`, so Next.js can recognize
the component boundary. Application state still belongs in your client
component. See [`examples/next/app/Schedule.tsx`](../examples/next/app/Schedule.tsx).

## Controlled navigation

```tsx
const [date, setDate] = useState<CalendarDateInput>("2026-09-14");

<Calendar
    date={date}
    onDateChange={(nextDate) => {
        setDate(nextDate);
        analytics.track("calendar_navigated", { nextDate });
    }}
/>
```

The callback fires with a normalized `Date`; controlled mode changes only
after the application updates `date`.

## Resources and grouping

```tsx
interface Room {
    id: string;
    name: string;
    floor: number;
}

const rooms: Room[] = [
    { id: "studio", name: "Studio", floor: 1 },
    { id: "workshop", name: "Workshop", floor: 2 }
];

<Calendar<Meeting, Room>
    view="week"
    events={events}
    viewProps={{
        resources: {
            items: rooms,
            getTitle: (room) => `${room.name} · floor ${room.floor}`
        },
        groupBy: "resource"
    }}
/>
```

Events assign with `resourceId` or `resourceIds`. To use another event shape,
provide `getEventIds`.

## Localization and messages

```tsx
import {
    defaultCalendarMessages,
    preloadCalendarLocale
} from "@chronolanejs/react";

void preloadCalendarLocale("pt-PT");

const portugueseMessages = {
    ...defaultCalendarMessages,
    previous: () => "Anterior",
    next: () => "Seguinte",
    agendaEmpty: () => "Sem eventos neste período."
};

<Calendar
    locale="pt-PT"
    localeFallback={<p role="status">A carregar calendário…</p>}
    messages={portugueseMessages}
/>
```

Keep complete formatter and message registries stable outside render. Locale
loading uses React Suspense.

## Custom renderer

```tsx
import type { TimeGridEventProps } from "@chronolanejs/react";

function ProductEvent({ event, segment, selected, elementProps }: TimeGridEventProps<Meeting, Room>) {
    return (
        <div
            {...elementProps}
            className={`${elementProps.className} product-event`}
            data-resource-id={segment.resourceId ?? undefined}
            data-selected={selected || undefined}
        >
            <strong>{event.title}</strong>
            <small>{event.owner.name}</small>
        </div>
    );
}

<Calendar<Meeting, Room>
    events={events}
    viewProps={{ components: { event: ProductEvent } }}
/>
```

Use `event` for application identity and `segment` for the clipped interval,
day, and resource context. Positioning stays in `elementProps`.
Always spread `elementProps`; see [Accessibility](./accessibility.md).

## Interaction state updates

```tsx
const [events, setEvents] = useState(initialEvents);
const [selectedEventIds, setSelectedEventIds] = useState<CalendarEventId[]>([]);
const [selectedRange, setSelectedRange] = useState<CalendarSelectionRange>();

<Calendar<Meeting, Room>
    events={events}
    selectedEventIds={selectedEventIds}
    onEventSelect={(event) => {
        if (event.id != null) setSelectedEventIds([event.id]);
    }}
    onEventOpen={(event) => setEditorEvent(event)}
    eventInteractions={{
        onContextMenu: (event, interaction) => {
            interaction.preventDefault();
            setMenuEvent(event);
        }
    }}
    viewProps={{
        selectedRange,
        onSlotSelect: (slot) => {
            setSelectedRange({ start: slot.start, end: slot.end });
        },
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

ChronoLaneJS proposes actions; it never mutates application data. Optimistic
updates, persistence, validation, undo, and server synchronization remain
application responsibilities.
