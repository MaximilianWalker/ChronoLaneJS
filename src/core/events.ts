import { addDays } from "date-fns/addDays";
import { startOfDay } from "date-fns/startOfDay";

import { asCalendarDate } from "./date.js";
import type { CalendarEvent, NormalizedCalendarEvent } from "../types.js";

/**
 * Shallow-copies events and converts their start and end values to validated
 * calendar dates.
 *
 * @param events - Application event values to normalize.
 * @param timeZone - Optional IANA zone attached to each event's wall-clock fields.
 * @returns Normalized events in the same order as the input.
 * @throws TypeError if an event contains an invalid start or end value.
 * @throws RangeError if an event has an empty or reversed interval.
 */
export const normalizeEvents = <Event extends CalendarEvent>(
    events: Event[],
    timeZone?: string
): NormalizedCalendarEvent<Event>[] => events.map((event, index) => {
    let start: Date;
    let end: Date;

    try {
        start = asCalendarDate(event.start, timeZone);
    } catch {
        throw new TypeError(`Calendar event at index ${index} start must be valid.`);
    }
    try {
        end = asCalendarDate(event.end, timeZone);
    } catch {
        throw new TypeError(`Calendar event at index ${index} end must be valid.`);
    }
    if (end <= start) {
        throw new RangeError(
            `Calendar event at index ${index} end must be later than start.`
        );
    }

    return { ...event, start, end };
});

/**
 * Returns a non-mutating chronological sort of normalized events.
 *
 * Events with identical start times are ordered by title.
 *
 * @param events - Normalized events to sort.
 * @returns A new sorted array.
 */
export const sortEvents = <Event extends NormalizedCalendarEvent>(events: Event[]): Event[] => (
    [...events].sort((first, second) => {
        if (first.start < second.start) return -1;
        if (first.start > second.start) return 1;

        return (first.title ?? "").localeCompare(second.title ?? "");
    })
);

/**
 * Tests whether an event intersects a calendar day using half-open intervals.
 *
 * An event ending exactly at midnight does not overlap the following day.
 *
 * @param event - Normalized event to test.
 * @param day - Calendar day whose local boundaries should be used.
 * @returns Whether any part of the event falls within the day.
 */
export const eventOverlapsDay = (event: NormalizedCalendarEvent, day: Date): boolean => {
    const dayStart = startOfDay(day);
    const nextDayStart = addDays(dayStart, 1);
    return event.start < nextDayStart && event.end > dayStart;
};
