import { addDays } from "date-fns/addDays";
import { startOfDay } from "date-fns/startOfDay";

import { asCalendarDate } from "./date.js";
import type { CalendarEvent, NormalizedCalendarEvent } from "../types.js";

export const normalizeEvents = <Event extends CalendarEvent>(
    events: Event[],
    timeZone?: string
): NormalizedCalendarEvent<Event>[] => events.map((event) => ({
    ...event,
    start: asCalendarDate(event.start, timeZone),
    end: asCalendarDate(event.end, timeZone)
}));

export const sortEvents = <Event extends NormalizedCalendarEvent>(events: Event[]): Event[] => (
    [...events].sort((first, second) => {
    if (first.start < second.start) return -1;
    if (first.start > second.start) return 1;

    return (first.title ?? "").localeCompare(second.title ?? "");
    })
);

export const eventOverlapsDay = (event: NormalizedCalendarEvent, day: Date): boolean => {
    const dayStart = startOfDay(day);
    const nextDayStart = addDays(dayStart, 1);
    return event.start < nextDayStart && event.end > dayStart;
};
