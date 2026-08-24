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

export interface DayGroup<Event extends CalendarEvent> {
    day: Date;
    events: EventOccurrence<Event>[];
}

export const createGroups = <Event extends CalendarEvent>(
    days: Date[],
    collection: NormalizedEventCollection<Event>
): DayGroup<Event>[] => days.flatMap((day, dayIndex) => {
    const previousDays = days.slice(0, dayIndex);
    const groupEvents = collection.events.filter((event) => (
        eventOverlapsDay(event, day)
        && !previousDays.some((previousDay) => (
            eventOverlapsDay(event, previousDay)
        ))
    ));

    return groupEvents.length === 0
        ? []
        : [{
            day,
            events: sortEvents(groupEvents).map((event) => ({
                key: collection.getKey(event),
                event
            }))
        }];
});
