import { startOfDay } from "date-fns/startOfDay";

import { asCalendarDate } from "./date.js";
import type { CalendarDateInput } from "../types.js";

export interface CalendarNavigationBoundaries {
    minDate: Date | null;
    maxDate: Date | null;
}

const normalizeBoundary = (
    value: CalendarDateInput | null | undefined,
    name: "minDate" | "maxDate",
    timeZone?: string
): Date | null => {
    if (value == null) return null;

    try {
        return startOfDay(asCalendarDate(value, timeZone));
    } catch (error) {
        if (error instanceof TypeError) {
            throw new TypeError(`Calendar ${name} must be a valid date.`, { cause: error });
        }
        throw error;
    }
};

/**
 * Normalizes and validates the inclusive days that bound calendar navigation.
 *
 * @throws TypeError if either supplied boundary is not a valid date.
 * @throws RangeError if `maxDate` precedes `minDate`.
 */
export const normalizeCalendarNavigationBoundaries = (
    minDate: CalendarDateInput | null | undefined,
    maxDate: CalendarDateInput | null | undefined,
    timeZone?: string
): CalendarNavigationBoundaries => {
    const normalizedMinDate = normalizeBoundary(minDate, "minDate", timeZone);
    const normalizedMaxDate = normalizeBoundary(maxDate, "maxDate", timeZone);

    if (
        normalizedMinDate != null
        && normalizedMaxDate != null
        && normalizedMaxDate < normalizedMinDate
    ) {
        throw new RangeError("Calendar maxDate must not be before minDate.");
    }

    return {
        minDate: normalizedMinDate,
        maxDate: normalizedMaxDate
    };
};

/** Returns which directions would move the current navigable period outward. */
export const getCalendarNavigationState = ({
    anchorDate,
    periodStart,
    periodEnd,
    minDate,
    maxDate
}: CalendarNavigationBoundaries & {
    anchorDate: Date;
    periodStart: Date;
    periodEnd: Date;
}): { previousDisabled: boolean; nextDisabled: boolean } => {
    const anchorDay = startOfDay(anchorDate);

    if (minDate != null && anchorDay < minDate) {
        return { previousDisabled: true, nextDisabled: false };
    }
    if (maxDate != null && anchorDay > maxDate) {
        return { previousDisabled: false, nextDisabled: true };
    }

    return {
        previousDisabled: minDate != null
            && (anchorDay <= minDate || periodStart <= minDate),
        nextDisabled: maxDate != null
            && (anchorDay >= maxDate || periodEnd >= maxDate)
    };
};

/**
 * Resolves a proposed navigation anchor within the inclusive boundary days.
 * An existing out-of-bounds anchor first recovers to its nearest boundary;
 * otherwise the proposal is normalized and clamped.
 */
export const resolveCalendarNavigationDate = (
    anchorDate: Date,
    value: CalendarDateInput,
    { minDate, maxDate }: CalendarNavigationBoundaries,
    timeZone?: string
): Date => {
    const date = asCalendarDate(value, timeZone);
    const anchorDay = startOfDay(anchorDate);

    if (minDate != null && anchorDay < minDate) {
        return asCalendarDate(minDate, timeZone);
    }
    if (maxDate != null && anchorDay > maxDate) {
        return asCalendarDate(maxDate, timeZone);
    }

    const day = startOfDay(date);

    if (minDate != null && day < minDate) return asCalendarDate(minDate, timeZone);
    if (maxDate != null && day > maxDate) return asCalendarDate(maxDate, timeZone);
    return date;
};
