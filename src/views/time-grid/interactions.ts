import { addMilliseconds } from "date-fns/addMilliseconds";
import type { CalendarEvent } from "../../types.js";
import type { TimeGridEventLayout } from "./types.js";

/**
 * Resolves a boolean interaction setting that may be event-specific.
 *
 * @param value - Static setting or predicate evaluated for the event.
 * @param event - Event passed to a predicate setting.
 * @returns Whether the interaction is enabled for the event.
 */
export const isEventInteractionEnabled = <Event>(
    value: boolean | ((event: Event) => boolean),
    event: Event
): boolean => (
    typeof value === "function" ? value(event) : value
);

/**
 * Moves an event to a slot while preserving its original duration.
 *
 * Clipped layout segments use `originalStart` and `originalEnd`, preventing a
 * multi-day event from shrinking when dragged from one of its visible segments.
 *
 * @param event - Positioned time-grid event being moved.
 * @param start - New event start.
 * @returns A copied layout event with updated start and end values.
 */
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
