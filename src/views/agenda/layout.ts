import { eventOverlapsDay, sortEvents } from "../../core/events.js";
import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../types.js";

export interface DayGroup<Event extends CalendarEvent> {
    day: Date;
    events: NormalizedCalendarEvent<Event>[];
}

export const createGroups = <Event extends CalendarEvent>(
    days: Date[],
    events: NormalizedCalendarEvent<Event>[]
): DayGroup<Event>[] => days.flatMap((day, dayIndex) => {
    const previousDays = days.slice(0, dayIndex);
    const groupEvents = events.filter((event) => (
        eventOverlapsDay(event, day)
        && !previousDays.some((previousDay) => (
            eventOverlapsDay(event, previousDay)
        ))
    ));

    return groupEvents.length === 0
        ? []
        : [{ day, events: sortEvents(groupEvents) }];
});
