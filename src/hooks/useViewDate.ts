"use client";

import { useCallback, useMemo, useState } from "react";
import { asCalendarDate } from "../core/date.js";
import type { CalendarDateInput } from "../types.js";

interface UseViewDateOptions {
    date?: CalendarDateInput;
    defaultDate?: CalendarDateInput;
    timeZone?: string;
    onDateChange?: (date: Date) => void;
}

/**
 * Manages the anchor date shared by controlled and uncontrolled calendar views.
 *
 * @remarks
 * `date` enables controlled mode. Otherwise the hook initializes from
 * `defaultDate` or the current time. Every exposed date is validated and
 * normalized for the configured time zone.
 *
 * @param options - Controlled value, initial values, time zone, and change callback.
 * @returns The normalized anchor date and a setter that respects controlled mode.
 */
export const useViewDate = ({
    date: controlledDate,
    defaultDate,
    timeZone,
    onDateChange
}: UseViewDateOptions): {
    anchorDate: Date;
    setDate: (date: CalendarDateInput) => void;
} => {
    const [uncontrolledDate, setUncontrolledDate] = useState(() => (
        asCalendarDate(defaultDate ?? new Date(), timeZone)
    ));
    const isControlled = controlledDate != null;
    const externalDate = controlledDate ?? uncontrolledDate;
    const anchorDate = useMemo(
        () => asCalendarDate(externalDate, timeZone),
        [externalDate, timeZone]
    );
    const setDate = useCallback((nextDate: CalendarDateInput) => {
        const calendarDate = asCalendarDate(nextDate, timeZone);
        if (!isControlled) {
            setUncontrolledDate(calendarDate);
        }
        onDateChange?.(calendarDate);
    }, [isControlled, onDateChange, timeZone]);

    return { anchorDate, setDate };
};
