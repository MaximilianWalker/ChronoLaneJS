import { addMilliseconds } from "date-fns";
import type { CalendarEvent, TimeGridEventLayout } from "../../types.js";

export const moveTimeGridEvent = <
    Event extends CalendarEvent,
    Resource
>(
    event: TimeGridEventLayout<Event, Resource>,
    start: Date
): TimeGridEventLayout<Event, Resource> => {
    const originalStart = event.originalStart ?? event.start;
    const originalEnd = event.originalEnd ?? event.end;
    const duration = originalEnd.getTime() - originalStart.getTime();

    return {
        ...event,
        start,
        end: addMilliseconds(start, duration)
    };
};
