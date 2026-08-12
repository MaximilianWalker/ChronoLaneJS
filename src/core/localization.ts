import { format } from "date-fns/format";
import { isSameDay } from "date-fns/isSameDay";
import { isSameMonth } from "date-fns/isSameMonth";

import type {
    CalendarFormatters,
    CalendarMessages,
    CalendarNavigationMessageContext
} from "../types.js";

const navigationRangeName = ({
    range,
    view
}: CalendarNavigationMessageContext): string => {
    if (view === "day") return "day";
    if (view === "week") return "week";
    if (view === "month") return "month";
    if (view === "agenda") return "agenda range";
    if (view === "resource") return "resource range";
    if (range.days.length === 1) return "day";
    if (range.days.length === 7) return "week";
    return "range";
};

/**
 * Default locale-aware date and time formatters used by every built-in view.
 *
 * @remarks
 * The registry is complete and immutable. Create a stable replacement by
 * spreading this object outside render and overriding the required functions.
 */
export const defaultCalendarFormatters = Object.freeze<CalendarFormatters>({
    time: (date, { locale }) => format(date, "p", { locale }),
    date: (date, { locale }) => format(date, "PPPP", { locale }),
    weekday: (date, { locale }) => format(date, "EEE", { locale }),
    dayHeader: (date, { locale, view }) => {
        if (view === "month") return format(date, "d", { locale });
        if (view === "agenda") return format(date, "PPPP", { locale });
        if (view === "day" || view === "resource") {
            return format(date, "EEEE, MMMM do", { locale });
        }
        return format(date, "EEEE do", { locale });
    },
    rangeHeader: (range, { locale, view }) => {
        if (view === "month") {
            return format(range.start, "MMMM yyyy", { locale });
        }
        if (view === "agenda") {
            return `${format(range.start, "PP", { locale })} – ${format(range.end, "PP", { locale })}`;
        }
        if (isSameDay(range.start, range.end)) {
            return format(range.start, "PPPP", { locale });
        }
        if (isSameMonth(range.start, range.end)) {
            return format(range.start, "MMMM yyyy", { locale });
        }
        return `${format(range.start, "MMM yyyy", { locale })} – ${format(range.end, "MMM yyyy", { locale })}`;
    }
});

/**
 * Default English text used by every built-in view and renderer.
 *
 * @remarks
 * Date formatting follows `locale`; application text does not translate
 * automatically. Create a complete, stable translated registry by spreading
 * this object outside render and overriding its functions.
 */
export const defaultCalendarMessages = Object.freeze<CalendarMessages>({
    previous: (context) => `Previous ${navigationRangeName(context)}`,
    next: (context) => `Next ${navigationRangeName(context)}`,
    timeGridLabel: () => "Calendar grid",
    monthGridLabel: () => "Month calendar grid",
    slotLabel: ({ date, time }) => `Calendar slot, ${date}, ${time}`,
    eventLabel: ({
        title,
        description,
        startDate,
        startTime,
        endDate,
        endTime
    }) => [
        title ?? "Calendar event",
        `${startDate}, ${startTime} to ${endDate}, ${endTime}`,
        description
    ].filter(Boolean).join(", "),
    timeRange: ({ startTime, endTime }) => `${startTime}–${endTime}`,
    agendaEmpty: () => "No events in this range.",
    moreEvents: ({ count }) => `+${count} more`
});
