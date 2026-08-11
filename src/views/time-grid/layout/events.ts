import { sortEvents } from "../../../core/events.js";
import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../../types.js";
import type {
    TimeGridColumn,
    TimeGridEventLayout,
    TimeGridEventSegment
} from "../types.js";
import { atDayTime, getGridRows } from "./timeScale.js";

interface CreateEventSegmentsOptions<
    Event extends CalendarEvent,
    Resource
> {
    events: NormalizedCalendarEvent<Event>[];
    columns: TimeGridColumn<Resource>[];
    minTime: Date;
    maxTime: Date;
    getResourceId: (resource: Resource) => unknown;
    getEventResourceIds: (event: NormalizedCalendarEvent<Event>) => unknown[];
}

/** Tests whether an event's resource assignments include a grid column. */
const belongsToColumn = <Resource>(
    eventResourceIds: unknown[],
    column: TimeGridColumn<Resource>,
    getResourceId: (resource: Resource) => unknown
): boolean => (
    column.resource == null
    || eventResourceIds.includes(getResourceId(column.resource))
);

/**
 * Clips normalized events to every visible day and matching resource column.
 *
 * Multi-day and multi-resource events can produce multiple independent
 * segments. Each segment retains its normalized source event for renderers and
 * interactions that require unclipped boundaries and resource data.
 *
 * @param options - Events, columns, visible times, and resource accessors.
 * @returns Positioned event segments without overlap-lane assignments.
 */
export const createEventSegments = <Event extends CalendarEvent, Resource>({
    events,
    columns,
    minTime,
    maxTime,
    getResourceId,
    getEventResourceIds
}: CreateEventSegmentsOptions<Event, Resource>): TimeGridEventSegment<Event, Resource>[] => {
    const resourceIdsByEvent = new Map(events.map((event) => [
        event,
        getEventResourceIds(event)
    ]));

    return columns.flatMap((column, columnIndex) => {
        const visibleDayStart = atDayTime(column.day, minTime);
        const visibleDayEnd = atDayTime(column.day, maxTime);

        return events.flatMap((event) => {
            if (!belongsToColumn(
                resourceIdsByEvent.get(event) ?? [],
                column,
                getResourceId
            )) return [];

            const visibleStart = event.start > visibleDayStart
                ? event.start
                : visibleDayStart;
            const visibleEnd = event.end < visibleDayEnd
                ? event.end
                : visibleDayEnd;

            if (visibleEnd <= visibleStart) return [];

            return [{
                ...event,
                event,
                start: visibleStart,
                end: visibleEnd,
                day: column.day,
                dayIndex: column.dayIndex,
                columnIndex,
                resource: column.resource,
                resourceIndex: column.resourceIndex,
                ...getGridRows(visibleStart, visibleEnd, visibleDayStart)
            }];
        });
    });
};

/**
 * Assigns horizontal lanes to overlapping event segments within each column.
 *
 * Lanes are reused after an event ends. Every connected overlap cluster shares
 * the same `laneCount`, so its events calculate consistent widths.
 *
 * @param events - Positioned event segments to arrange.
 * @param columnCount - Number of columns available in the layout.
 * @returns Event segments augmented with lane indexes and cluster lane counts.
 */
export const assignEventLanes = <Event extends CalendarEvent, Resource>(
    events: TimeGridEventSegment<Event, Resource>[],
    columnCount: number
): TimeGridEventLayout<Event, Resource>[] => {
    const eventsByColumn = Array.from(
        { length: columnCount },
        () => [] as TimeGridEventSegment<Event, Resource>[]
    );
    events.forEach((event) => eventsByColumn[event.columnIndex]?.push(event));

    return eventsByColumn.flatMap((columnEvents) => {
        const eventsWithLanes: TimeGridEventLayout<Event, Resource>[] = [];
        let cluster: Array<TimeGridEventSegment<Event, Resource> & { laneIndex: number }> = [];
        let clusterEnd = -1;
        let laneEnds: number[] = [];

        /** Flushes the current overlap cluster with its final lane count. */
        const finishCluster = () => {
            if (cluster.length === 0) return;

            const laneCount = laneEnds.length;
            cluster.forEach((event) => eventsWithLanes.push({
                ...event,
                laneCount
            }));
            cluster = [];
            clusterEnd = -1;
            laneEnds = [];
        };

        sortEvents(columnEvents).forEach((event) => {
            if (cluster.length > 0 && event.startRow >= clusterEnd) finishCluster();

            let laneIndex = laneEnds.findIndex((endRow) => endRow <= event.startRow);
            if (laneIndex === -1) {
                laneIndex = laneEnds.length;
                laneEnds.push(event.endRow);
            } else {
                laneEnds[laneIndex] = event.endRow;
            }

            cluster.push({ ...event, laneIndex });
            clusterEnd = Math.max(clusterEnd, event.endRow);
        });

        finishCluster();
        return eventsWithLanes;
    });
};
