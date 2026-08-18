import type { CalendarEvent, CalendarResourceId } from "../../types.js";
import {
    atDayMinute
} from "./layout/timeScale.js";
import type { ResolvedTimeWindow } from "./layout/timeScale.js";
import type { LayoutColumn } from "./layout/types.js";
import type {
    TimeGridEventPosition,
    TimeGridEventResize,
    TimeGridEventResizeEdge
} from "./types.js";

/** One valid, visible boundary to which an event edge may be resized. */
export interface TimeGridResizeBoundary<Resource = unknown>
    extends TimeGridEventPosition<Resource> {
    date: Date;
    columnIndex: number;
    row: number;
}

/** One adjacent pair of valid boundaries on the configured resize scale. */
export interface TimeGridResizeInterval<Resource = unknown> {
    start: TimeGridResizeBoundary<Resource>;
    end: TimeGridResizeBoundary<Resource>;
}

interface CreateTimeGridResizeIntervalsOptions<Resource> {
    columns: LayoutColumn<Resource>[];
    timeWindow: ResolvedTimeWindow;
    resizeStep: number;
}

interface CreateTimeGridResizeBoundariesOptions<
    Event extends CalendarEvent,
    Resource
> {
    event: TimeGridEventResize<Event, Resource>["event"];
    edge: TimeGridEventResizeEdge;
    resourceId: CalendarResourceId | null;
    intervals: TimeGridResizeInterval<Resource>[];
}

/** Validates the positive whole-minute increment used by event resizing. */
export const resolveTimeGridResizeStep = (resizeStep: number): number => {
    if (!Number.isInteger(resizeStep) || resizeStep < 1) {
        throw new RangeError("Calendar resizeStep must be a positive integer.");
    }

    return resizeStep;
};

/** Creates every adjacent boundary pair on the visible resize scale. */
export const createTimeGridResizeIntervals = <Resource>({
    columns,
    timeWindow,
    resizeStep
}: CreateTimeGridResizeIntervalsOptions<Resource>): TimeGridResizeInterval<Resource>[] => {
    const step = resolveTimeGridResizeStep(resizeStep);
    const { startMinute, totalMinutes } = timeWindow;

    return columns.flatMap((column, columnIndex) => {
        const createBoundary = (offset: number): TimeGridResizeBoundary<Resource> => ({
            date: atDayMinute(column.day, startMinute + offset),
            day: column.day,
            resource: column.resource,
            resourceId: column.resourceId,
            columnIndex,
            row: offset + 1
        });
        const intervals: TimeGridResizeInterval<Resource>[] = [];

        for (let offset = 0; offset < totalMinutes; offset += step) {
            intervals.push({
                start: createBoundary(offset),
                end: createBoundary(Math.min(offset + step, totalMinutes))
            });
        }

        return intervals;
    });
};

/**
 * Returns every visible resize boundary that leaves at least one resize interval.
 *
 * @param options - Source event, edge, occurrence resource, and resize scale.
 * @returns Chronologically ordered valid boundaries across visible days.
 */
export const createTimeGridResizeBoundaries = <
    Event extends CalendarEvent,
    Resource
>({
    event,
    edge,
    resourceId,
    intervals
}: CreateTimeGridResizeBoundariesOptions<Event, Resource>): TimeGridResizeBoundary<Resource>[] => (
    intervals.flatMap((interval) => {
        if (interval.start.resourceId !== resourceId) return [];

        if (edge === "start") {
            if (interval.end.date > event.end) return [];
            return [interval.start];
        }

        if (interval.start.date < event.start) return [];
        return [interval.end];
    }).sort((first, second) => first.date.getTime() - second.date.getTime())
);

/** Chooses the valid boundary nearest a pointer position in one column. */
export const findClosestResizeBoundary = <Resource>(
    boundaries: TimeGridResizeBoundary<Resource>[],
    columnIndex: number,
    row: number,
    edge: TimeGridEventResizeEdge
): TimeGridResizeBoundary<Resource> | undefined => {
    const columnBoundaries = boundaries.filter(
        (boundary) => boundary.columnIndex === columnIndex
    );
    if (columnBoundaries.length === 0) {
        return edge === "start" ? boundaries.at(-1) : boundaries[0];
    }

    return columnBoundaries.reduce((closest, boundary) => (
        Math.abs(boundary.row - row) < Math.abs(closest.row - row)
            ? boundary
            : closest
    ));
};

/** Returns the next valid keyboard boundary in the requested direction. */
export const findAdjacentResizeBoundary = <Resource>(
    boundaries: TimeGridResizeBoundary<Resource>[],
    current: Date,
    direction: -1 | 1
): TimeGridResizeBoundary<Resource> | undefined => {
    const currentTime = current.getTime();
    if (direction === 1) {
        return boundaries.find((boundary) => boundary.date.getTime() > currentTime);
    }

    for (let index = boundaries.length - 1; index >= 0; index -= 1) {
        const boundary = boundaries[index];
        if (boundary != null && boundary.date.getTime() < currentTime) {
            return boundary;
        }
    }

    return undefined;
};

/** Builds the complete application-facing resize proposal. */
export const createEventResize = <Event extends CalendarEvent, Resource>(
    event: TimeGridEventResize<Event, Resource>["event"],
    edge: TimeGridEventResizeEdge,
    boundary: TimeGridResizeBoundary<Resource>,
    source: TimeGridEventPosition<Resource>
): TimeGridEventResize<Event, Resource> => ({
    event,
    edge,
    start: edge === "start" ? boundary.date : event.start,
    end: edge === "end" ? boundary.date : event.end,
    source
});
