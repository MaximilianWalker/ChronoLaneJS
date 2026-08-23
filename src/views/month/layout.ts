import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import { endOfMonth } from "date-fns/endOfMonth";
import { endOfWeek } from "date-fns/endOfWeek";
import { isSameDay } from "date-fns/isSameDay";
import { isSameMonth } from "date-fns/isSameMonth";
import { startOfDay } from "date-fns/startOfDay";
import { startOfMonth } from "date-fns/startOfMonth";
import { startOfWeek } from "date-fns/startOfWeek";

import { eventOverlapsDay, sortEvents } from "../../core/events.js";
import type { NormalizedEventCollection } from "../../core/events.js";
import type {
    CalendarEvent,
    CalendarWeekStart,
    NormalizedCalendarEvent
} from "../../types.js";

export interface EventOccurrence<Event extends CalendarEvent> {
    key: string;
    event: NormalizedCalendarEvent<Event>;
}

export interface DayEntry<Event extends CalendarEvent> {
    key: number;
    day: Date;
    className: string;
    outsideMonth: boolean;
    selected: boolean;
    showEvents: boolean;
    visibleEvents: EventOccurrence<Event>[];
    callbackEvents: NormalizedCalendarEvent<Event>[];
    backgroundEvents: EventOccurrence<Event>[];
    hiddenEventCount: number;
}

export interface WeekEntry<Event extends CalendarEvent> {
    key: number;
    days: DayEntry<Event>[];
}

export interface WeekdayHeader {
    key: number;
    day: Date;
}

export interface Layout<Event extends CalendarEvent> {
    monthStart: Date;
    monthEnd: Date;
    rangeStart: Date;
    rangeEnd: Date;
    days: Date[];
    weekdayHeaders: WeekdayHeader[];
    weeks: WeekEntry<Event>[];
}

interface CreateLayoutOptions<Event extends CalendarEvent> {
    anchorDate: Date;
    weekStartsOn: CalendarWeekStart;
    events: NormalizedEventCollection<Event>;
    backgroundEvents: NormalizedEventCollection<Event>;
    selectedDate: Date | null;
    showOutsideDays: boolean;
    maxEventsPerDay: number;
    overflowEnabled: boolean;
}

/** Resolves the number of visible event rows accepted by a month cell. */
export const resolveMaxEvents = (value: number): number => {
    if (!Number.isInteger(value) || value < 0) {
        throw new RangeError("maxEventsPerDay must be a non-negative integer.");
    }
    return value;
};

export const createLayout = <Event extends CalendarEvent>({
    anchorDate,
    weekStartsOn,
    events,
    backgroundEvents,
    selectedDate,
    showOutsideDays,
    maxEventsPerDay,
    overflowEnabled
}: CreateLayoutOptions<Event>): Layout<Event> => {
    const monthStart = startOfMonth(anchorDate);
    const monthEnd = startOfDay(endOfMonth(anchorDate));
    const rangeStart = startOfWeek(monthStart, { weekStartsOn });
    const rangeEnd = startOfDay(endOfWeek(monthEnd, { weekStartsOn }));
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    const maxEvents = resolveMaxEvents(maxEventsPerDay);
    const entries = days.map((day): DayEntry<Event> => {
        const dayEvents = sortEvents(events.events.filter((event) => (
            eventOverlapsDay(event, day)
        ))).map((event) => ({ key: events.getKey(event), event }));
        const outsideMonth = !isSameMonth(day, anchorDate);
        const selected = selectedDate != null && isSameDay(day, selectedDate);
        const hasOverflow = overflowEnabled && dayEvents.length > maxEvents;

        return {
            key: day.getTime(),
            day,
            className: [
                "month-view_day",
                outsideMonth ? "is-outside" : "",
                selected ? "is-selected" : ""
            ].filter(Boolean).join(" "),
            outsideMonth,
            selected,
            showEvents: !outsideMonth || showOutsideDays,
            visibleEvents: hasOverflow ? dayEvents.slice(0, maxEvents) : dayEvents,
            callbackEvents: dayEvents.map(({ event }) => event),
            backgroundEvents: backgroundEvents.events
            .filter((event) => eventOverlapsDay(event, day))
            .map((event) => ({
                key: backgroundEvents.getKey(event),
                event
            })),
            hiddenEventCount: hasOverflow ? dayEvents.length - maxEvents : 0
        };
    });
    const weeks = Array.from(
        { length: Math.ceil(entries.length / 7) },
        (_, index) => {
            const weekDays = entries.slice(index * 7, (index + 1) * 7);
            const firstDay = weekDays[0];
            if (!firstDay) throw new Error("Month week must contain at least one day.");

            return { key: firstDay.key, days: weekDays };
        }
    );

    return {
        monthStart,
        monthEnd,
        rangeStart,
        rangeEnd,
        days,
        weekdayHeaders: entries.slice(0, 7).map(({ key, day }) => ({ key, day })),
        weeks
    };
};
