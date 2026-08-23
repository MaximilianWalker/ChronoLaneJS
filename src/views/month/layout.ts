import { eventOverlapsDay, sortEvents } from "../../core/events.js";
import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../types.js";

export interface DayEntry<Event extends CalendarEvent> {
    day: Date;
    events: NormalizedCalendarEvent<Event>[];
    backgroundEvents: NormalizedCalendarEvent<Event>[];
}

interface CreateWeeksOptions<Event extends CalendarEvent> {
    days: Date[];
    events: NormalizedCalendarEvent<Event>[];
    backgroundEvents: NormalizedCalendarEvent<Event>[];
}

export const createWeeks = <Event extends CalendarEvent>({
    days,
    events,
    backgroundEvents
}: CreateWeeksOptions<Event>): DayEntry<Event>[][] => {
    const entries = days.map((day) => ({
        day,
        events: sortEvents(events.filter((event) => (
            eventOverlapsDay(event, day)
        ))),
        backgroundEvents: backgroundEvents.filter((event) => (
            eventOverlapsDay(event, day)
        ))
    }));

    return Array.from(
        { length: Math.ceil(entries.length / 7) },
        (_, index) => entries.slice(index * 7, (index + 1) * 7)
    );
};
