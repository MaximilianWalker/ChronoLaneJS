import {
    addDays,
    eachDayOfInterval,
    startOfDay,
    startOfWeek
} from "date-fns";

const resolveValue = (value, anchorDate, context) => (
    typeof value === "function" ? value(anchorDate, context) : value
);

const uniqueSortedDays = (days) => {
    const uniqueDays = new Map();

    days.forEach((day) => {
        if (!(day instanceof Date) || Number.isNaN(day.getTime())) {
            throw new TypeError("Calendar ranges must contain valid Date objects.");
        }

        const normalizedDay = startOfDay(day);
        uniqueDays.set(normalizedDay.getTime(), normalizedDay);
    });

    return [...uniqueDays.values()].sort((a, b) => a - b);
};

export const createCalendarRange = ({
    start,
    end,
    days,
    includeDay
}) => {
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
        throw new TypeError("A calendar range requires a valid start Date.");
    }

    let rangeEnd = end;
    if (rangeEnd == null) {
        if (!Number.isInteger(days) || days < 1) {
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
    range,
    anchorDate,
    { weekStartsOn = 0, defaultRange = "week" } = {}
) => {
    const context = { weekStartsOn };
    const definition = resolveValue(range ?? defaultRange, anchorDate, context);

    if (definition === "day") return [startOfDay(anchorDate)];

    if (definition === "week") {
        return createCalendarRange({
            start: startOfWeek(anchorDate, { weekStartsOn }),
            days: 7
        });
    }

    if (Number.isInteger(definition)) {
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
        const start = resolveValue(definition.start, anchorDate, context) ?? anchorDate;
        const end = resolveValue(definition.end, anchorDate, context);
        const resolvedDays = uniqueSortedDays(createCalendarRange({
            start,
            end,
            days: definition.days,
            includeDay: definition.includeDay
        }));

        if (resolvedDays.length === 0) {
            throw new RangeError("Calendar range filters must retain at least one day.");
        }
        return resolvedDays;
    }

    throw new TypeError("Unsupported calendar range definition.");
};

export const getCalendarRangeBounds = (days) => ({
    start: days[0],
    end: days[days.length - 1]
});

export const moveCalendarDate = (date, direction, stepDays) => {
    if (direction !== -1 && direction !== 1) {
        throw new RangeError("Calendar navigation direction must be -1 or 1.");
    }
    if (!Number.isInteger(stepDays) || stepDays < 1) {
        throw new RangeError("Calendar navigation step must be a positive integer.");
    }

    return addDays(date, direction * stepDays);
};
