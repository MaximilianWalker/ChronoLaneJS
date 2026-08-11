"use client";

import { useCallback, useMemo, useState } from "react";
import { asCalendarDate, parseCalendarDate } from "../core/date.js";
import type { CalendarDateInput } from "../types.js";

interface UseCalendarViewDateOptions {
    date?: CalendarDateInput;
    defaultDate?: CalendarDateInput;
    startDate?: CalendarDateInput;
    timeZone?: string;
    onDateChange?: (date: Date) => void;
}

/**
 * Manages the anchor date shared by controlled and uncontrolled calendar views.
 *
 * @remarks
 * `date` enables controlled mode. Otherwise the hook initializes from
 * `startDate`, `defaultDate`, or the current time, in that order. A changed
 * legacy `startDate` also resets uncontrolled state. Every exposed date is
 * validated and normalized for the configured time zone.
 *
 * @param options - Controlled value, initial values, time zone, and change callback.
 * @returns The normalized anchor date and a setter that respects controlled mode.
 */
export const useCalendarViewDate = ({
    date: controlledDate,
    defaultDate,
    startDate,
    timeZone,
    onDateChange
}: UseCalendarViewDateOptions): {
    anchorDate: Date;
    setDate: (date: CalendarDateInput) => void;
} => {
    const [today] = useState(() => new Date());
    const initialDate = controlledDate ?? startDate ?? defaultDate ?? today;
    const initialStartTimestamp = startDate == null
        ? null
        : parseCalendarDate(startDate).getTime();
    const [uncontrolledState, setUncontrolledState] = useState(() => ({
        date: asCalendarDate(initialDate, timeZone),
        startTimestamp: initialStartTimestamp
    }));
    const isControlled = controlledDate != null;
    const startTimestamp = startDate == null
        ? null
        : parseCalendarDate(startDate).getTime();
    let uncontrolledDate = uncontrolledState.date;

    if (!isControlled && startTimestamp !== uncontrolledState.startTimestamp) {
        uncontrolledDate = startDate == null
            ? uncontrolledState.date
            : asCalendarDate(startDate, timeZone);
        setUncontrolledState({
            date: uncontrolledDate,
            startTimestamp
        });
    }

    const externalDate = controlledDate ?? uncontrolledDate;
    const anchorDate = useMemo(
        () => asCalendarDate(externalDate, timeZone),
        [externalDate, timeZone]
    );
    const setDate = useCallback((nextDate: CalendarDateInput) => {
        const calendarDate = asCalendarDate(nextDate, timeZone);
        if (!isControlled) {
            setUncontrolledState((current) => ({
                ...current,
                date: calendarDate
            }));
        }
        onDateChange?.(calendarDate);
    }, [isControlled, onDateChange, timeZone]);

    return { anchorDate, setDate };
};
