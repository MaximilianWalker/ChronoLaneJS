import { addDays } from "date-fns/addDays";
import { constructFrom } from "date-fns/constructFrom";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import { startOfDay } from "date-fns/startOfDay";
import { startOfWeek } from "date-fns/startOfWeek";

import type {
    CalendarRange,
    CalendarRangeContext,
    CalendarRangeDefinition,
    CalendarRangeNavigation,
    CalendarWeekStart,
    ResolvedCalendarRange
} from "../types.js";

/** Resolves a range option that may be a literal or an anchor-aware callback. */
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

/**
 * Normalizes dates to day boundaries, removes duplicates, and sorts ascending.
 *
 * @throws TypeError if any value is not a valid `Date`.
 */
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
    dayCount?: number;
    includeDay?: (day: Date) => boolean;
}

/**
 * Creates an inclusive sequence of calendar days from a start and either an
 * end date or a day count.
 *
 * @param options - Range boundaries and optional day predicate.
 * @returns Normalized days in chronological order.
 * @throws TypeError if a boundary is not a valid `Date`.
 * @throws RangeError if the day count is invalid or the end precedes the start.
 */
export const createCalendarRange = ({
    start,
    end,
    dayCount,
    includeDay
}: CreateCalendarRangeOptions): Date[] => {
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
        throw new TypeError("A calendar range requires a valid start Date.");
    }

    let rangeEnd = end;
    if (rangeEnd == null) {
        if (dayCount == null || !Number.isInteger(dayCount) || dayCount < 1) {
            throw new RangeError("Calendar range dayCount must be a positive integer.");
        }
        rangeEnd = addDays(start, dayCount - 1);
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

const getCalendarDaySpan = (start: Date, end: Date): number => (
    differenceInCalendarDays(startOfDay(end), startOfDay(start)) + 1
);

const assertNavigationDirection: (
    direction: number
) => asserts direction is -1 | 1 = (direction) => {
    if (direction !== -1 && direction !== 1) {
        throw new RangeError("Calendar navigation direction must be -1 or 1.");
    }
};

const assertNavigationStep = (stepDays: number): void => {
    if (!Number.isInteger(stepDays) || stepDays < 1) {
        throw new RangeError("Calendar navigation stepDays must be a positive integer.");
    }
};

/**
 * Returns the first and last day of a resolved calendar range.
 *
 * @param days - Non-empty, chronologically ordered range days.
 * @returns The range's inclusive start and end days.
 * @throws RangeError if `days` is empty.
 */
export const getCalendarRangeBounds = (days: Date[]): { start: Date; end: Date } => {
    const start = days[0];
    const end = days.at(-1);
    if (!start || !end) {
        throw new RangeError("Calendar ranges must contain at least one day.");
    }
    return { start, end };
};

/**
 * Moves a calendar date forward or backward by a fixed number of days.
 *
 * @param date - Navigation anchor.
 * @param direction - `-1` for previous or `1` for next.
 * @param stepDays - Positive integer number of days to move.
 * @returns The shifted date.
 * @throws RangeError if the direction or step is invalid.
 */
export const moveCalendarDate = (
    date: Date,
    direction: -1 | 1,
    stepDays: number
): Date => {
    assertNavigationDirection(direction);
    assertNavigationStep(stepDays);

    return addDays(date, direction * stepDays);
};

const createResolvedRange = (
    days: Date[],
    anchorDate: Date,
    context: CalendarRangeContext,
    defaultStepDays: number,
    navigation?: CalendarRangeNavigation
): ResolvedCalendarRange => {
    const { start, end } = getCalendarRangeBounds(days);
    const range: CalendarRange = { start, end, days };

    if (navigation == null) {
        assertNavigationStep(defaultStepDays);
        return {
            ...range,
            navigate: (direction) => moveCalendarDate(
                anchorDate,
                direction,
                defaultStepDays
            )
        };
    }

    const stepDays = navigation.stepDays;
    const resolveAnchor = navigation.resolveAnchor;
    const hasStep = stepDays != null;
    const hasResolver = resolveAnchor != null;

    if (hasStep === hasResolver) {
        throw new TypeError(
            "Calendar range navigation must define exactly one of stepDays or resolveAnchor."
        );
    }

    if (hasStep) {
        assertNavigationStep(stepDays);
        return {
            ...range,
            navigate: (direction) => moveCalendarDate(
                anchorDate,
                direction,
                stepDays
            )
        };
    }

    if (typeof resolveAnchor !== "function") {
        throw new TypeError("Calendar range navigation resolveAnchor must be a function.");
    }

    return {
        ...range,
        navigate: (direction) => {
            assertNavigationDirection(direction);
            const nextAnchor = resolveAnchor(
                anchorDate,
                direction,
                range,
                context
            );
            if (!(nextAnchor instanceof Date) || Number.isNaN(nextAnchor.getTime())) {
                throw new TypeError(
                    "Calendar range navigation must resolve to a valid Date."
                );
            }
            return constructFrom(nextAnchor, nextAnchor);
        }
    };
};

const resolveRangeDefinition = (
    definition: CalendarRangeDefinition,
    anchorDate: Date,
    context: CalendarRangeContext
): ResolvedCalendarRange => {
    if (typeof definition === "function") {
        return resolveRangeDefinition(
            definition(anchorDate, context),
            anchorDate,
            context
        );
    }

    if (definition === "day") {
        return createResolvedRange([startOfDay(anchorDate)], anchorDate, context, 1);
    }

    if (definition === "week") {
        return createResolvedRange(createCalendarRange({
            start: startOfWeek(anchorDate, { weekStartsOn: context.weekStartsOn }),
            dayCount: 7
        }), anchorDate, context, 7);
    }

    if (typeof definition === "number" && Number.isInteger(definition)) {
        return createResolvedRange(
            createCalendarRange({ start: anchorDate, dayCount: definition }),
            anchorDate,
            context,
            definition
        );
    }

    if (Array.isArray(definition)) {
        const resolvedDays = uniqueSortedDays(definition);
        if (resolvedDays.length === 0) {
            throw new RangeError("Calendar ranges must contain at least one day.");
        }
        const { start, end } = getCalendarRangeBounds(resolvedDays);
        return createResolvedRange(
            resolvedDays,
            anchorDate,
            context,
            getCalendarDaySpan(start, end)
        );
    }

    if (definition && typeof definition === "object") {
        const options = definition;

        if (options.dates != null) {
            if (
                "start" in options
                || "end" in options
                || "dayCount" in options
                || "includeDay" in options
            ) {
                throw new TypeError(
                    "Calendar range dates cannot be combined with span options."
                );
            }
            const resolvedDays = uniqueSortedDays(resolveValue(
                options.dates,
                anchorDate,
                context
            ));
            if (resolvedDays.length === 0) {
                throw new RangeError("Calendar ranges must contain at least one day.");
            }
            const { start, end } = getCalendarRangeBounds(resolvedDays);
            return createResolvedRange(
                resolvedDays,
                anchorDate,
                context,
                getCalendarDaySpan(start, end),
                options.navigation
            );
        }

        const hasEnd = "end" in options && options.end != null;
        const hasDayCount = "dayCount" in options && options.dayCount != null;
        if (hasEnd === hasDayCount) {
            throw new TypeError(
                "Calendar range options must define exactly one of end or dayCount."
            );
        }

        const start = options.start == null
            ? anchorDate
            : resolveValue(options.start, anchorDate, context);
        const end = options.end == null
            ? undefined
            : resolveValue(options.end, anchorDate, context);
        const resolvedDays = uniqueSortedDays(createCalendarRange({
            start,
            end,
            dayCount: options.dayCount,
            includeDay: options.includeDay
        }));

        if (resolvedDays.length === 0) {
            throw new RangeError("Calendar range filters must retain at least one day.");
        }

        let defaultStepDays: number;
        if (options.dayCount != null) {
            defaultStepDays = options.dayCount;
        } else if (end != null) {
            defaultStepDays = getCalendarDaySpan(start, end);
        } else {
            throw new TypeError(
                "Calendar range options must define exactly one of end or dayCount."
            );
        }
        return createResolvedRange(
            resolvedDays,
            anchorDate,
            context,
            defaultStepDays,
            options.navigation
        );
    }

    throw new TypeError("Unsupported calendar range definition.");
};

/**
 * Resolves any supported range definition relative to an anchor date.
 *
 * Supports day and week presets, consecutive day counts, explicit date arrays,
 * configurable range objects, and callbacks returning any of those forms.
 *
 * @param range - Range definition, or `null`/`undefined` to use the default.
 * @param anchorDate - Date used to resolve relative ranges and callbacks.
 * @param options - Week convention and fallback range.
 * @returns A normalized range carrying its own navigation behavior.
 * @throws TypeError if the definition or any included date is invalid.
 * @throws RangeError if the resolved range is empty or has invalid boundaries.
 */
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
): ResolvedCalendarRange => {
    const context = { weekStartsOn };
    return resolveRangeDefinition(range ?? defaultRange, anchorDate, context);
};
