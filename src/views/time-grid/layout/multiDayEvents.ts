import { addDays } from "date-fns/addDays";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { startOfDay } from "date-fns/startOfDay";

import { eventOverlapsDay, sortEvents } from "../../../core/events.js";
import type {
    CalendarEvent,
    CalendarResourceConfig,
    CalendarResourceId,
    NormalizedCalendarEvent
} from "../../../types.js";
import { resolveCalendarEventResourceIds } from "../resources.js";
import type {
    EventDrop,
    EventPosition,
    EventResize,
    EventResizeEdge
} from "../types.js";
import type { LayoutColumn } from "./types.js";

export type LayoutMultiDayEventSegment<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> = Omit<NormalizedCalendarEvent<Event>, "resource"> & {
    event: NormalizedCalendarEvent<Event>;
    day: Date;
    dayIndex: number;
    columnIndex: number;
    columnSpan: number;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
    resourceIndex: number | null;
};

export type LayoutMultiDayEvent<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> = LayoutMultiDayEventSegment<Event, Resource> & { laneIndex: number };

export interface MultiDayEventLayout<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    events: LayoutMultiDayEvent<Event, Resource>[];
    laneCount: number;
}

interface CreateMultiDayEventLayoutOptions<
    Event extends CalendarEvent,
    Resource
> {
    events: NormalizedCalendarEvent<Event>[];
    columns: LayoutColumn<Resource>[];
    resources?: CalendarResourceConfig<Event, Resource>;
    getEventInterval?: (
        event: NormalizedCalendarEvent<Event>
    ) => { start: Date; end: Date };
}

interface MultiDayEventPreviewOptions<
    Event extends CalendarEvent,
    Resource
> {
    event: NormalizedCalendarEvent<Event>;
    start: Date;
    end: Date;
    resourceId: CalendarResourceId | null;
    columns: LayoutColumn<Resource>[];
}

interface MultiDayEventResizeOptions<
    Event extends CalendarEvent,
    Resource
> {
    event: NormalizedCalendarEvent<Event>;
    edge: EventResizeEdge;
    dayOffset: number;
    source: EventPosition<Resource>;
}

/** Resolves a pointer coordinate to one visible dedicated-region column. */
export const getMultiDayPointerColumnIndex = (
    clientX: number,
    gridLeft: number,
    gridWidth: number,
    columnCount: number
): number | undefined => {
    if (gridWidth <= 0 || columnCount <= 0) return undefined;

    return Math.min(
        columnCount - 1,
        Math.max(0, Math.floor((clientX - gridLeft) / gridWidth * columnCount))
    );
};

/** Resolves the event-origin column after a dedicated bar pointer movement. */
export const getMultiDayMoveTargetIndex = (
    originIndex: number,
    grabIndex: number,
    pointerIndex: number,
    columnCount: number
): number | undefined => {
    if (columnCount <= 0) return undefined;

    return Math.min(
        columnCount - 1,
        Math.max(0, originIndex + pointerIndex - grabIndex)
    );
};

/** Tests whether an event crosses at least one local calendar-day boundary. */
export const isMultiDayEvent = (
    event: NormalizedCalendarEvent
): boolean => startOfDay(event.start) < startOfDay(event.end);

const matchesResource = <Resource>(
    resourceIds: Set<CalendarResourceId>,
    column: LayoutColumn<Resource>
): boolean => column.resourceId == null || resourceIds.has(column.resourceId);

const createSegments = <Event extends CalendarEvent, Resource>(
    event: NormalizedCalendarEvent<Event>,
    columns: LayoutColumn<Resource>[],
    matchesColumn: (column: LayoutColumn<Resource>) => boolean,
    interval: { start: Date; end: Date } = event
): LayoutMultiDayEventSegment<Event, Resource>[] => {
    const positionedEvent = interval === event
        ? event
        : { ...event, ...interval };
    const matchingColumns = columns
        .map((column, columnIndex) => ({ column, columnIndex }))
        .filter(({ column }) => (
            matchesColumn(column) && eventOverlapsDay(positionedEvent, column.day)
        ));
    const groups: typeof matchingColumns[] = [];

    matchingColumns.forEach((entry) => {
        const group = groups.at(-1);
        const previous = group?.at(-1);
        if (
            group
            && previous
            && entry.columnIndex === previous.columnIndex + 1
            && entry.column.resourceId === previous.column.resourceId
        ) {
            group.push(entry);
        } else {
            groups.push([entry]);
        }
    });

    return groups.map((group): LayoutMultiDayEventSegment<Event, Resource> => {
        const first = group[0]!;
        const last = group.at(-1)!;
        const visibleStart = startOfDay(first.column.day);
        const visibleEnd = addDays(startOfDay(last.column.day), 1);
        const eventWithoutResource: Omit<
            NormalizedCalendarEvent<Event>,
            "resource"
        > = positionedEvent;

        return {
            ...eventWithoutResource,
            event,
            start: interval.start > visibleStart ? interval.start : visibleStart,
            end: interval.end < visibleEnd ? interval.end : visibleEnd,
            day: first.column.day,
            dayIndex: first.column.dayIndex,
            columnIndex: first.columnIndex,
            columnSpan: group.length,
            resource: first.column.resource,
            resourceId: first.column.resourceId,
            resourceIndex: first.column.resourceIndex
        };
    });
};

/**
 * Clips multi-day events into contiguous visible column spans and assigns lanes.
 *
 * Resource columns split spans whenever unrelated columns interrupt them, so
 * every rendered bar remains aligned with the existing time-grid hierarchy.
 */
export const createMultiDayEventLayout = <
    Event extends CalendarEvent,
    Resource
>({
    events,
    columns,
    resources,
    getEventInterval
}: CreateMultiDayEventLayoutOptions<Event, Resource>): MultiDayEventLayout<Event, Resource> => {
    const segments = sortEvents(events).flatMap((event) => {
        const resourceIds = resolveCalendarEventResourceIds(
            event,
            resources?.getEventIds
        );

        return createSegments(
            event,
            columns,
            (column) => matchesResource(resourceIds, column),
            getEventInterval?.(event)
        );
    }).sort((first, second) => (
        first.columnIndex - second.columnIndex
        || (second.columnIndex + second.columnSpan)
            - (first.columnIndex + first.columnSpan)
        || first.start.getTime() - second.start.getTime()
    ));
    const laneEnds: number[] = [];
    const positioned = segments.map((segment) => {
        let laneIndex = laneEnds.findIndex(
            (endColumn) => endColumn <= segment.columnIndex
        );
        if (laneIndex === -1) {
            laneIndex = laneEnds.length;
            laneEnds.push(segment.columnIndex + segment.columnSpan);
        } else {
            laneEnds[laneIndex] = segment.columnIndex + segment.columnSpan;
        }

        return { ...segment, laneIndex };
    });

    return { events: positioned, laneCount: laneEnds.length };
};

/** Projects a proposed dedicated event interval into visible column spans. */
export const createMultiDayEventPreview = <
    Event extends CalendarEvent,
    Resource
>({
    event,
    start,
    end,
    resourceId,
    columns
}: MultiDayEventPreviewOptions<Event, Resource>) => createSegments(
    { ...event, start, end },
    columns,
    (column) => column.resourceId == null || column.resourceId === resourceId,
    { start, end }
);

/** Builds a day-scale movement proposal while preserving wall-clock fields. */
export const createMultiDayEventDrop = <
    Event extends CalendarEvent,
    Resource
>(
    segment: LayoutMultiDayEvent<Event, Resource>,
    destination: LayoutColumn<Resource>
): EventDrop<Event, Resource> => {
    const dayOffset = differenceInCalendarDays(destination.day, segment.day);

    return {
        event: segment.event,
        start: addDays(segment.event.start, dayOffset),
        end: addDays(segment.event.end, dayOffset),
        source: {
            day: segment.day,
            resource: segment.resource,
            resourceId: segment.resourceId
        },
        destination: {
            day: destination.day,
            resource: destination.resource,
            resourceId: destination.resourceId
        }
    };
};

/** Builds a whole-calendar-day resize proposal for a dedicated event. */
export const createMultiDayEventResize = <
    Event extends CalendarEvent,
    Resource
>({
    event,
    edge,
    dayOffset,
    source
}: MultiDayEventResizeOptions<Event, Resource>): EventResize<Event, Resource> => ({
    event,
    edge,
    start: edge === "start" ? addDays(event.start, dayOffset) : event.start,
    end: edge === "end" ? addDays(event.end, dayOffset) : event.end,
    source
});

/** Returns the visible day offset represented by a dedicated resize handle. */
export const getMultiDayResizeOffset = (
    event: NormalizedCalendarEvent,
    edge: EventResizeEdge,
    day: Date
): number => {
    const boundaryDay = edge === "start"
        ? startOfDay(event.start)
        : event.end.getTime() === startOfDay(event.end).getTime()
            ? addDays(startOfDay(event.end), -1)
            : startOfDay(event.end);

    return differenceInCalendarDays(day, boundaryDay);
};
