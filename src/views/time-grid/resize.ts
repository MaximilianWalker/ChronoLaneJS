import type { CalendarEvent, CalendarResourceId } from "../../types.js";
import type { LayoutSlot } from "./layout/types.js";
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

interface CreateTimeGridResizeBoundariesOptions<
    Event extends CalendarEvent,
    Resource
> {
    event: TimeGridEventResize<Event, Resource>["event"];
    edge: TimeGridEventResizeEdge;
    resourceId: CalendarResourceId | null;
    slots: LayoutSlot<Resource>[];
    slotDuration: number;
}

/**
 * Returns every visible resize boundary that leaves at least one whole slot.
 *
 * @param options - Source event, edge, occurrence resource, and visible slots.
 * @returns Chronologically ordered valid boundaries across visible days.
 */
export const createTimeGridResizeBoundaries = <
    Event extends CalendarEvent,
    Resource
>({
    event,
    edge,
    resourceId,
    slots,
    slotDuration
}: CreateTimeGridResizeBoundariesOptions<Event, Resource>): TimeGridResizeBoundary<Resource>[] => (
    slots.flatMap((slot) => {
        if (slot.resourceId !== resourceId) return [];

        if (edge === "start") {
            if (slot.end > event.end) return [];
            return [{
                date: slot.start,
                day: slot.day,
                resource: slot.resource,
                resourceId: slot.resourceId,
                columnIndex: slot.columnIndex,
                row: (slot.timeIndex * slotDuration) + 1
            }];
        }

        if (slot.start < event.start) return [];
        return [{
            date: slot.end,
            day: slot.day,
            resource: slot.resource,
            resourceId: slot.resourceId,
            columnIndex: slot.columnIndex,
            row: (slot.timeIndex * slotDuration) + slot.duration + 1
        }];
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
