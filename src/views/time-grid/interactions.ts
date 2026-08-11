import { addMilliseconds } from "date-fns/addMilliseconds";
import type { CalendarEvent } from "../../types.js";
import type { TimeGridEventLayout } from "./types.js";

export const isEventInteractionEnabled = <Event>(
    value: boolean | ((event: Event) => boolean),
    event: Event
): boolean => (
    typeof value === "function" ? value(event) : value
);

export const moveEventToSlot = <
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
