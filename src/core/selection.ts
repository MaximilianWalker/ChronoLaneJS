import { asCalendarDate } from "./date.js";
import type {
    CalendarDateInput,
    CalendarSelectionRange
} from "../types.js";

const normalizeSelectionDate = (
    value: CalendarDateInput,
    boundary: "date" | "start" | "end",
    timeZone?: string
): Date => {
    try {
        return asCalendarDate(value, timeZone);
    } catch (error) {
        if (error instanceof TypeError) {
            throw new TypeError(
                `Calendar selection ${boundary} must be a valid date.`,
                { cause: error }
            );
        }
        throw error;
    }
};

/**
 * Normalizes one externally controlled selected day for calendar comparison.
 *
 * @throws TypeError if `value` is not a valid calendar date.
 */
export const normalizeCalendarSelectedDate = (
    value: CalendarDateInput,
    timeZone?: string
): Date => normalizeSelectionDate(value, "date", timeZone);

/**
 * Normalizes a controlled half-open selection range for calendar comparison.
 *
 * @throws TypeError if either boundary is not a valid calendar date.
 * @throws RangeError if the end does not follow the start.
 */
export const normalizeCalendarSelectionRange = (
    range: CalendarSelectionRange,
    timeZone?: string
): { start: Date; end: Date } => {
    const start = normalizeSelectionDate(range.start, "start", timeZone);
    const end = normalizeSelectionDate(range.end, "end", timeZone);

    if (end <= start) {
        throw new RangeError("Calendar selection range end must be after its start.");
    }

    return { start, end };
};
