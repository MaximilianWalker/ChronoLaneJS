import { eventOverlapsDay, sortEvents } from "../../core/events.js";
import type { NormalizedEventCollection } from "../../core/events.js";
import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../types.js";

export interface EventOccurrence<Event extends CalendarEvent> {
    key: string;
    event: NormalizedCalendarEvent<Event>;
}

export interface DayEntry<Event extends CalendarEvent> {
    day: Date;
    events: EventOccurrence<Event>[];
    backgroundEvents: EventOccurrence<Event>[];
}

interface CreateWeeksOptions<Event extends CalendarEvent> {
    days: Date[];
    events: NormalizedEventCollection<Event>;
    backgroundEvents: NormalizedEventCollection<Event>;
}

/** Resolves the number of visible event rows accepted by a month cell. */
export const resolveMaxEvents = (value: number): number => {
    if (!Number.isInteger(value) || value < 0) {
        throw new RangeError("maxEventsPerDay must be a non-negative integer.");
    }
    return value;
};

export const createWeeks = <Event extends CalendarEvent>({
    days,
    events,
    backgroundEvents
}: CreateWeeksOptions<Event>): DayEntry<Event>[][] => {
    const entries = days.map((day) => ({
        day,
        events: sortEvents(events.events.filter((event) => (
            eventOverlapsDay(event, day)
        ))).map((event) => ({ key: events.getKey(event), event })),
        backgroundEvents: backgroundEvents.events
            .filter((event) => eventOverlapsDay(event, day))
            .map((event) => ({
                key: backgroundEvents.getKey(event),
                event
            }))
    }));

    return Array.from(
        { length: Math.ceil(entries.length / 7) },
        (_, index) => entries.slice(index * 7, (index + 1) * 7)
    );
};
