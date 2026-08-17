import { useState } from "react";

import Calendar, {
    defaultCalendarMessages,
    preloadCalendarLocale
} from "@chronolanejs/react";
import type {
    CalendarDateInput,
    CalendarEvent,
    CalendarEventId,
    CalendarResourceConfig,
    TimeGridEventProps
} from "@chronolanejs/react";

interface Room {
    id: string;
    name: string;
}

interface Meeting extends CalendarEvent {
    id: string;
    owner: string;
}

const rooms: Room[] = [
    { id: "studio", name: "Studio" },
    { id: "workshop", name: "Workshop" }
];

const roomConfig: CalendarResourceConfig<Meeting, Room> = { items: rooms };

const initialEvents: Meeting[] = [{
    id: "planning",
    owner: "Ava",
    title: "Planning",
    description: "Set weekly priorities",
    start: "2026-09-14T09:00:00",
    end: "2026-09-14T10:15:00",
    resourceId: "studio",
    color: "#2563eb"
}, {
    id: "review",
    owner: "Noah",
    title: "Design review",
    start: "2026-09-15T11:00:00",
    end: "2026-09-15T12:00:00",
    resourceIds: ["studio", "workshop"],
    color: "#7c3aed"
}];

const messages = {
    ...defaultCalendarMessages,
    agendaEmpty: () => "Nothing scheduled in this range."
};

void preloadCalendarLocale("en-GB");

function MeetingRenderer({
    event,
    segment,
    selected,
    elementProps
}: TimeGridEventProps<Meeting, Room>) {
    return (
        <div
            {...elementProps}
            className={`${elementProps.className} example-event`}
            data-selected={selected || undefined}
            data-resource-id={segment.resourceId ?? undefined}
        >
            <strong>{event.title}</strong>
            <span>{event.owner}</span>
        </div>
    );
}

export default function App() {
    const [date, setDate] = useState<CalendarDateInput>("2026-09-14");
    const [events, setEvents] = useState(initialEvents);
    const [selectedEventIds, setSelectedEventIds] = useState<CalendarEventId[]>([]);
    const [selectedRange, setSelectedRange] = useState<{
        start: CalendarDateInput;
        end: CalendarDateInput;
    }>();
    const [status, setStatus] = useState("Choose an event or slot.");

    return (
        <main>
            <h1>Team schedule</h1>
            <p aria-live="polite">{status}</p>
            <Calendar<Meeting, Room>
                date={date}
                onDateChange={setDate}
                events={events}
                locale="en-GB"
                localeFallback={<p role="status">Loading locale…</p>}
                messages={messages}
                timeZone="UTC"
                selectedEventIds={selectedEventIds}
                onEventSelect={(event) => {
                    setSelectedEventIds([event.id]);
                    setStatus(`Selected ${event.title ?? "event"}.`);
                }}
                onEventOpen={(event) => setStatus(`Open ${event.title ?? "event"}.`)}
                viewProps={{
                    resources: roomConfig,
                    groupBy: "resource",
                    minTime: "08:00",
                    maxTime: "18:00",
                    slotDuration: 30,
                    resizeStep: 15,
                    labelInterval: 60,
                    slotSizing: { minWidth: 140, height: 44 },
                    selectedRange,
                    onSlotSelect: (slot) => {
                        setSelectedRange({ start: slot.start, end: slot.end });
                        setStatus(`Selected ${slot.start.toLocaleTimeString()}.`);
                    },
                    onEventDrop: ({ event, start, end, destination }) => {
                        setEvents((current) => current.map((item) => item.id === event.id
                            ? {
                                ...item,
                                start,
                                end,
                                resourceId: destination.resourceId ?? undefined,
                                resourceIds: undefined
                            }
                            : item));
                        setStatus(`Moved ${event.title ?? "event"}.`);
                    },
                    onEventResize: ({ event, start, end }) => {
                        setEvents((current) => current.map((item) => item.id === event.id
                            ? { ...item, start, end }
                            : item));
                        setStatus(`Resized ${event.title ?? "event"}.`);
                    },
                    components: { event: MeetingRenderer }
                }}
            />
        </main>
    );
}
