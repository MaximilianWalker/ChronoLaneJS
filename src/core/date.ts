import { constructFrom } from "date-fns/constructFrom";
import { setDate as setDateFn } from "date-fns/setDate";
import { setHours } from "date-fns/setHours";
import { setMilliseconds } from "date-fns/setMilliseconds";
import { setMinutes } from "date-fns/setMinutes";
import { setMonth } from "date-fns/setMonth";
import { setSeconds } from "date-fns/setSeconds";
import { setYear } from "date-fns/setYear";
import { TZDate } from "@date-fns/tz";

import type { CalendarDateInput } from "../types.js";

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Converts a supported calendar value into a new `Date` instance.
 *
 * Date-only strings use local calendar fields instead of being interpreted as
 * UTC. Other strings follow the JavaScript `Date` parser and invalid inputs
 * produce an invalid `Date` for callers that need deferred validation.
 *
 * @param value - Date instance, timestamp, or date string to parse.
 * @returns A cloned or newly parsed `Date`.
 */
export function parseCalendarDate(value: CalendarDateInput): Date {
    if (value instanceof Date) return constructFrom(value, value);

    if (typeof value === "number") return new Date(value);

    const match = CALENDAR_DATE_PATTERN.exec(value);
    if (!match) return new Date(value);

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year
        || date.getMonth() !== month - 1
        || date.getDate() !== day
    ) {
        return new Date(Number.NaN);
    }

    return date;
}

/**
 * Attaches an IANA time zone while preserving the date's visible calendar
 * fields.
 *
 * @remarks
 * This is a wall-clock conversion, not an instant conversion. For example,
 * 09:00 remains 09:00 after a time zone is attached. Without a time zone, or
 * for an invalid date, the original value is returned unchanged.
 *
 * @param value - Date whose calendar fields should be preserved.
 * @param timeZone - IANA time-zone name to attach.
 * @returns A `TZDate` when a time zone is supplied; otherwise `value`.
 */
export function toCalendarTimeZone(value: Date, timeZone: string): TZDate;
export function toCalendarTimeZone(value: Date, timeZone?: string): Date;
export function toCalendarTimeZone(value: Date, timeZone?: string): Date {
    if (!(value instanceof Date) || !timeZone || Number.isNaN(value.getTime())) return value;

    return new TZDate(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
        value.getHours(),
        value.getMinutes(),
        value.getSeconds(),
        value.getMilliseconds(),
        timeZone
    );
}

/**
 * Creates a calendar date for an absolute timestamp.
 *
 * Unlike {@link toCalendarTimeZone}, this preserves the represented instant
 * and derives the visible fields in the requested time zone.
 *
 * @param timestamp - Milliseconds since the Unix epoch.
 * @param timeZone - Optional IANA time-zone name.
 * @returns A zoned `TZDate`, or a native `Date` when no zone is provided.
 */
export function calendarDateFromTimestamp(timestamp: number, timeZone: string): TZDate;
export function calendarDateFromTimestamp(timestamp: number, timeZone?: string): Date;
export function calendarDateFromTimestamp(timestamp: number, timeZone?: string): Date {
    return timeZone ? new TZDate(timestamp, timeZone) : new Date(timestamp);
}

/**
 * Parses and validates a calendar value, then optionally attaches a time zone
 * while preserving its visible fields.
 *
 * @param value - Calendar date value to normalize.
 * @param timeZone - Optional IANA time-zone name used for calendar arithmetic.
 * @returns A valid calendar `Date`.
 * @throws TypeError if `value` does not represent a valid date.
 */
export function asCalendarDate(value: CalendarDateInput, timeZone?: string): Date {
    const date = parseCalendarDate(value);
    if (Number.isNaN(date.getTime())) {
        throw new TypeError("Calendar dates must be valid.");
    }
    return toCalendarTimeZone(date, timeZone);
}

/**
 * Replaces the calendar-date fields of a date while preserving its time.
 *
 * @param time - Date providing the time fields and date implementation.
 * @param year - Full year to set.
 * @param month - Zero-based month to set.
 * @param day - Day of the month to set.
 * @returns A new date with the requested calendar fields.
 */
export function setDate(time: Date, year = 1970, month = 0, day = 1): Date {
    return setDateFn(setMonth(setYear(time, year), month), day);
}

/**
 * Replaces the time fields of a date while preserving its calendar day.
 *
 * @param date - Date providing the calendar fields and date implementation.
 * @param hours - Hours to set.
 * @param minutes - Minutes to set.
 * @param seconds - Seconds to set.
 * @param milliseconds - Milliseconds to set.
 * @returns A new date with the requested time fields.
 */
export function setTime(
    date: Date,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0
): Date {
    return setMilliseconds(
        setSeconds(setMinutes(setHours(date, hours), minutes), seconds),
        milliseconds
    );
}
