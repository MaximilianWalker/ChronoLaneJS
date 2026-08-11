import { addDays } from "date-fns/addDays";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import { startOfDay } from "date-fns/startOfDay";
import { startOfWeek } from "date-fns/startOfWeek";

import type {
    CalendarRangeContext,
    CalendarRangeDefinition,
    CalendarWeekStart
} from "../types.js";

const resolveValue = <Value>(
    value: Value | ((anchorDate: Date, context: CalendarRangeContext) => Value),
    anchorDate: Date,
    context: CalendarRangeContext
): Value => (
    typeof value === "function"
        ? (value as (anchorDate: Date, context: CalendarRangeContext) => Value)(
            anchorDate,
            context
        )
        : value
);

const uniqueSortedDays = (days: Date[]): Date[] => {
    const uniqueDays = new Map<number, Date>();

    days.forEach((day) => {
        if (!(day instanceof Date) || Number.isNaN(day.getTime())) {
            throw new TypeError("Calendar ranges must contain valid Date objects.");
        }

        const normalizedDay = startOfDay(day);
        uniqueDays.set(normalizedDay.getTime(), normalizedDay);
    });

    return [...uniqueDays.values()].sort((a, b) => a.getTime() - b.getTime());
};

interface CreateCalendarRangeOptions {
    start: Date;
    end?: Date;
    days?: number;
    includeDay?: (day: Date) => boolean;
}

export const createCalendarRange = ({
    start,
    end,
    days,
    includeDay
}: CreateCalendarRangeOptions): Date[] => {
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
        throw new TypeError("A calendar range requires a valid start Date.");
    }

    let rangeEnd = end;
    if (rangeEnd == null) {
        if (days == null || !Number.isInteger(days) || days < 1) {
            throw new RangeError("Calendar range days must be a positive integer.");
        }
        rangeEnd = addDays(start, days - 1);
    }

    if (!(rangeEnd instanceof Date) || Number.isNaN(rangeEnd.getTime())) {
        throw new TypeError("A calendar range requires a valid end Date.");
    }
    if (rangeEnd < start) {
        throw new RangeError("Calendar range end must not be before its start.");
    }

    const rangeDays = eachDayOfInterval({
        start: startOfDay(start),
        end: startOfDay(rangeEnd)
    });

    return includeDay ? rangeDays.filter(includeDay) : rangeDays;
};

export const resolveCalendarRange = (
    range: CalendarRangeDefinition | null | undefined,
    anchorDate: Date,
    {
        weekStartsOn = 0,
        defaultRange = "week"
    }: {
        weekStartsOn?: CalendarWeekStart;
        defaultRange?: "day" | "week" | number;
    } = {}
): Date[] => {
    const context = { weekStartsOn };
    const definition = resolveValue<CalendarRangeDefinition>(
        range ?? defaultRange,
        anchorDate,
        context
    );

    if (definition === "day") return [startOfDay(anchorDate)];

    if (definition === "week") {
        return createCalendarRange({
            start: startOfWeek(anchorDate, { weekStartsOn }),
            days: 7
        });
    }

    if (typeof definition === "number" && Number.isInteger(definition)) {
        return createCalendarRange({ start: anchorDate, days: definition });
    }

    if (Array.isArray(definition)) {
        const resolvedDays = uniqueSortedDays(definition);
        if (resolvedDays.length === 0) {
            throw new RangeError("Calendar ranges must contain at least one day.");
        }
        return resolvedDays;
    }

    if (definition && typeof definition === "object") {
        const options = definition;
        const start = options.start == null
            ? anchorDate
            : resolveValue(options.start, anchorDate, context);
        const end = options.end == null
            ? undefined
            : resolveValue(options.end, anchorDate, context);
        const resolvedDays = uniqueSortedDays(createCalendarRange({
            start,
            end,
            days: options.days,
            includeDay: options.includeDay
        }));

        if (resolvedDays.length === 0) {
            throw new RangeError("Calendar range filters must retain at least one day.");
        }
        return resolvedDays;
    }

    throw new TypeError("Unsupported calendar range definition.");
};

export const getCalendarRangeBounds = (days: Date[]): { start: Date; end: Date } => {
    const start = days[0];
    const end = days.at(-1);
    if (!start || !end) {
        throw new RangeError("Calendar ranges must contain at least one day.");
    }
    return { start, end };
};

export const moveCalendarDate = (
    date: Date,
    direction: -1 | 1,
    stepDays: number
): Date => {
    if (direction !== -1 && direction !== 1) {
        throw new RangeError("Calendar navigation direction must be -1 or 1.");
    }
    if (!Number.isInteger(stepDays) || stepDays < 1) {
        throw new RangeError("Calendar navigation step must be a positive integer.");
    }

    return addDays(date, direction * stepDays);
};
