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

export function parseCalendarDate(value: CalendarDateInput): Date {
    if (value instanceof Date) return new Date(value.getTime());

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

// Offset-free timestamps represent visible calendar fields. Preserve those
// fields while attaching the time zone used for calculations.
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

export function calendarDateFromTimestamp(timestamp: number, timeZone: string): TZDate;
export function calendarDateFromTimestamp(timestamp: number, timeZone?: string): Date;
export function calendarDateFromTimestamp(timestamp: number, timeZone?: string): Date {
    return timeZone ? new TZDate(timestamp, timeZone) : new Date(timestamp);
}

export function asCalendarDate(value: CalendarDateInput, timeZone?: string): Date {
    const date = parseCalendarDate(value);
    if (Number.isNaN(date.getTime())) {
        throw new TypeError("Calendar dates must be valid.");
    }
    return toCalendarTimeZone(date, timeZone);
}

export function setDate(time: Date, year = 1970, month = 0, day = 1): Date {
    return setDateFn(setMonth(setYear(time, year), month), day);
}

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
