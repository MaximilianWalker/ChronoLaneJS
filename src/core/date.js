import {
    setDate as setDateFn,
    setHours,
    setMilliseconds,
    setMinutes,
    setMonth,
    setSeconds,
    setYear
} from "date-fns";
import { TZDate } from "@date-fns/tz";

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseCalendarDate(value) {
    if (value instanceof Date) return new Date(value.getTime());

    const match = CALENDAR_DATE_PATTERN.exec(value);
    if (!match) return new Date(value);

    const [, year, month, day] = match.map(Number);
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

// Offset-free timestamps represent visible calendar fields. Preserve those
// fields while attaching the time zone used for calculations.
export function toCalendarTimeZone(value, timeZone) {
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

export function calendarDateFromTimestamp(timestamp, timeZone) {
    return timeZone ? new TZDate(timestamp, timeZone) : new Date(timestamp);
}

export function asCalendarDate(value, timeZone) {
    const date = parseCalendarDate(value);
    if (Number.isNaN(date.getTime())) {
        throw new TypeError("Calendar dates must be valid.");
    }
    return toCalendarTimeZone(date, timeZone);
}

export function setDate(time, year = 1970, month = 0, day = 1) {
    return setDateFn(setMonth(setYear(time, year), month), day);
}

export function setTime(date, hours = 0, minutes = 0, seconds = 0, milliseconds = 0) {
    return setMilliseconds(
        setSeconds(setMinutes(setHours(date, hours), minutes), seconds),
        milliseconds
    );
}
