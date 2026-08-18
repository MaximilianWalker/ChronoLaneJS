import { addDays } from "date-fns/addDays";

import { setTime } from "../../../core/date.js";
import type { TimeOfDay } from "../types.js";
import type {
    LayoutColumn,
    LayoutDivider,
    LayoutSlot
} from "./types.js";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MILLISECONDS_PER_DAY = 86_400_000;

export interface ResolvedTimeWindow {
    startMinute: number;
    endMinute: number;
    totalMinutes: number;
}

/** Converts a strict wall-clock value to its minute offset after midnight. */
const parseTime = (
    value: TimeOfDay | "24:00",
    boundary: "minTime" | "maxTime"
): number => {
    if (boundary === "maxTime" && value === "24:00") return 1_440;

    const match = typeof value === "string" ? TIME_PATTERN.exec(value) : null;
    if (!match) {
        const limit = boundary === "maxTime" ? "24:00" : "23:59";
        throw new TypeError(`Calendar ${boundary} must use HH:mm between 00:00 and ${limit}.`);
    }

    return (Number(match[1]) * 60) + Number(match[2]);
};

/**
 * Validates and resolves the visible daily time window to minute offsets.
 *
 * @param minTime - Inclusive start in strict `HH:mm` format.
 * @param maxTime - Exclusive end in strict `HH:mm` format or `24:00`.
 * @returns Validated start, end, and duration minute offsets.
 * @throws TypeError if either boundary is malformed.
 * @throws RangeError if the end does not follow the start.
 */
export const resolveTimeWindow = (
    minTime: TimeOfDay,
    maxTime: TimeOfDay | "24:00"
): ResolvedTimeWindow => {
    const startMinute = parseTime(minTime, "minTime");
    const endMinute = parseTime(maxTime, "maxTime");

    if (endMinute <= startMinute) {
        throw new RangeError("Calendar maxTime must be after minTime.");
    }

    return {
        startMinute,
        endMinute,
        totalMinutes: endMinute - startMinute
    };
};

/** Creates a calendar date at a wall-clock minute on the supplied day. */
export const atDayMinute = (day: Date, minute: number): Date => {
    const targetDay = minute === 1_440 ? addDays(day, 1) : day;
    const minuteOfDay = minute % 1_440;

    return setTime(
        targetDay,
        Math.floor(minuteOfDay / 60),
        minuteOfDay % 60
    );
};

/** Converts a date to its wall-clock minute offset relative to a calendar day. */
const relativeWallClockMinute = (day: Date, date: Date): number => (
    (
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
        - Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())
    ) / MILLISECONDS_PER_DAY * 1_440
    + (date.getHours() * 60)
    + date.getMinutes()
    + (date.getSeconds() / 60)
    + (date.getMilliseconds() / 60_000)
);

/**
 * Maps a visible interval to one-based, end-exclusive CSS grid row lines.
 *
 * @param start - Visible event start.
 * @param end - Visible event end.
 * @param day - Calendar day owning the grid column.
 * @param windowStartMinute - Inclusive start minute of the visible window.
 * @returns Start and end row lines at minute precision.
 */
export const getGridRows = (
    start: Date,
    end: Date,
    day: Date,
    windowStartMinute: number
): { startRow: number; endRow: number } => ({
    startRow: Math.floor(relativeWallClockMinute(day, start)) - windowStartMinute + 1,
    endRow: Math.ceil(relativeWallClockMinute(day, end)) - windowStartMinute + 1
});

interface CreateTimeScaleOptions<Resource> {
    firstDay: Date;
    columns: LayoutColumn<Resource>[];
    timeWindow: ResolvedTimeWindow;
    slotDuration: number;
    labelInterval: number;
}

interface TimeScale<Resource> {
    slots: LayoutSlot<Resource>[];
    slotRows: LayoutSlot<Resource>[][];
    dividers: LayoutDivider[];
    totalMinutes: number;
}

/**
 * Creates grid slots, divider labels, and minute dimensions for a time window.
 *
 * The scale uses wall-clock minutes so rows remain stable across daylight-saving
 * transitions. Label intervals must align with complete slot boundaries.
 *
 * @param options - Columns, visible window, slot duration, and label interval.
 * @returns The slots and dividers shared by every grid column.
 * @throws RangeError if either interval is invalid or incompatible.
 */
export const createTimeScale = <Resource>({
    firstDay,
    columns,
    timeWindow,
    slotDuration,
    labelInterval
}: CreateTimeScaleOptions<Resource>): TimeScale<Resource> => {
    if (!Number.isInteger(slotDuration) || slotDuration < 1) {
        throw new RangeError("Calendar slotDuration must be a positive integer.");
    }
    if (
        !Number.isInteger(labelInterval)
        || labelInterval < slotDuration
        || labelInterval % slotDuration !== 0
    ) {
        throw new RangeError(
            "Calendar labelInterval must be an integer multiple of slotDuration."
        );
    }

    const { startMinute, endMinute, totalMinutes } = timeWindow;
    const slotCount = Math.ceil(totalMinutes / slotDuration);
    const dividerCount = Math.ceil(totalMinutes / labelInterval);
    const slotRows = Array.from({ length: slotCount }, (_, timeIndex) => {
        const slotStartMinute = startMinute + (timeIndex * slotDuration);
        const slotEndMinute = Math.min(slotStartMinute + slotDuration, endMinute);

        return columns.map((column, columnIndex) => ({
            key: `${timeIndex}-${column.key}`,
            start: atDayMinute(column.day, slotStartMinute),
            end: atDayMinute(column.day, slotEndMinute),
            duration: slotEndMinute - slotStartMinute,
            timeIndex,
            day: column.day,
            dayIndex: column.dayIndex,
            columnIndex,
            resource: column.resource,
            resourceId: column.resourceId,
            isDividerBoundary: slotEndMinute !== endMinute
                && (slotEndMinute - startMinute) % labelInterval === 0
        }));
    });
    const slots = slotRows.flat();
    const dividers = Array.from({ length: dividerCount }, (_, index) => {
        const minute = startMinute + (index * labelInterval);

        return {
            key: `${firstDay.getTime()}-${minute}`,
            time: atDayMinute(firstDay, minute),
            startRow: (index * labelInterval) + 1,
            rowSpan: Math.min(
                labelInterval,
                totalMinutes - (index * labelInterval)
            )
        };
    });

    return {
        slots,
        slotRows,
        dividers,
        totalMinutes
    };
};
