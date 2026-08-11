import { addMinutes } from "date-fns";

import { setTime } from "../../core/date.js";
import { sortEvents } from "../../core/events.js";
import type {
    CalendarEvent,
    NormalizedCalendarEvent,
    TimeGridColumn,
    TimeGridEventLayout,
    TimeGridEventSegment,
    TimeGridLayout
} from "../../types.js";

const defaultGetResourceId = (resource: unknown): unknown => (
    resource && typeof resource === "object" && "id" in resource
        ? resource.id
        : undefined
);

const defaultGetEventResourceIds = (event: NormalizedCalendarEvent): unknown[] => {
    if (Array.isArray(event.resourceIds)) return event.resourceIds;
    if (event.resourceId != null) return [event.resourceId];
    if (
        event.resource
        && typeof event.resource === "object"
        && "id" in event.resource
        && event.resource.id != null
    ) return [event.resource.id];
    return [];
};

const wallClockMinutes = (date: Date): number => (
    (date.getHours() * 60) + date.getMinutes()
);

const atDayTime = (day: Date, time: Date): Date => setTime(
    day,
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds()
);

interface ColumnMembershipOptions<
    Event extends CalendarEvent,
    Resource
> {
    event: NormalizedCalendarEvent<Event>;
    column: TimeGridColumn<Resource>;
    getResourceId: (resource: Resource) => unknown;
    getEventResourceIds: (event: NormalizedCalendarEvent<Event>) => unknown[];
}

const eventBelongsToColumn = <Event extends CalendarEvent, Resource>({
    event,
    column,
    getResourceId,
    getEventResourceIds
}: ColumnMembershipOptions<Event, Resource>): boolean => {
    if (column.resource == null) return true;

    const resourceId = getResourceId(column.resource);
    return getEventResourceIds(event).includes(resourceId);
};

const buildColumns = <Resource>(
    days: Date[],
    resources: Resource[]
): TimeGridColumn<Resource>[] => {
    if (resources.length === 0) {
        return days.map((day, dayIndex) => ({
            key: `${day.getTime()}`,
            day,
            dayIndex,
            resource: null,
            resourceIndex: null
        }));
    }

    return days.flatMap((day, dayIndex) => resources.map((resource, resourceIndex) => ({
        key: `${day.getTime()}-${resourceIndex}`,
        day,
        dayIndex,
        resource,
        resourceIndex
    })));
};

interface SegmentEventsOptions<
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

const segmentEvents = <Event extends CalendarEvent, Resource>({
    events,
    columns,
    minTime,
    maxTime,
    getResourceId,
    getEventResourceIds
}: SegmentEventsOptions<Event, Resource>): TimeGridEventSegment<Event, Resource>[] => (
    columns.flatMap((column, columnIndex) => {
    const visibleDayStart = atDayTime(column.day, minTime);
    const visibleDayEnd = atDayTime(column.day, maxTime);

    return events.flatMap((event) => {
        if (!eventBelongsToColumn({
            event,
            column,
            getResourceId,
            getEventResourceIds
        })) return [];

        const visibleStart = event.start > visibleDayStart
            ? event.start
            : visibleDayStart;
        const visibleEnd = event.end < visibleDayEnd
            ? event.end
            : visibleDayEnd;

        if (visibleEnd <= visibleStart) return [];

        return [{
            ...event,
            originalStart: event.start,
            originalEnd: event.end,
            start: visibleStart,
            end: visibleEnd,
            dayIndex: column.dayIndex,
            columnIndex,
            resource: column.resource,
            resourceIndex: column.resourceIndex,
            startRow: wallClockMinutes(visibleStart) - wallClockMinutes(visibleDayStart) + 1,
            endRow: wallClockMinutes(visibleEnd) - wallClockMinutes(visibleDayStart) + 1
        }];
    });
    })
);

const assignLanes = <Event extends CalendarEvent, Resource>(
    events: TimeGridEventSegment<Event, Resource>[],
    columns: TimeGridColumn<Resource>[]
): TimeGridEventLayout<Event, Resource>[] => {
    const eventsWithLanes: TimeGridEventLayout<Event, Resource>[] = [];

    columns.forEach((_column, columnIndex) => {
        const columnEvents = sortEvents(events.filter(
            (event) => event.columnIndex === columnIndex
        ));
        let cluster: Array<TimeGridEventSegment<Event, Resource> & { laneIndex: number }> = [];
        let clusterEnd = -1;
        let laneEnds: number[] = [];

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

        columnEvents.forEach((event) => {
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
    });

    return eventsWithLanes;
};

export interface CreateTimeGridLayoutOptions<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    days: Date[];
    events: NormalizedCalendarEvent<Event>[];
    backgroundEvents: NormalizedCalendarEvent<Event>[];
    resources?: Resource[];
    minTime: Date;
    maxTime: Date;
    step: number;
    dividerInterval: number;
    getResourceId?: (resource: Resource) => unknown;
    getEventResourceIds?: (event: NormalizedCalendarEvent<Event>) => unknown[];
}

export const createTimeGridLayout = <Event extends CalendarEvent, Resource>({
    days,
    events,
    backgroundEvents,
    resources = [],
    minTime,
    maxTime,
    step,
    dividerInterval,
    getResourceId = defaultGetResourceId,
    getEventResourceIds = defaultGetEventResourceIds
}: CreateTimeGridLayoutOptions<Event, Resource>): TimeGridLayout<Event, Resource> => {
    const totalMinutes = wallClockMinutes(maxTime) - wallClockMinutes(minTime);
    if (totalMinutes <= 0) {
        throw new RangeError("Calendar maxTime must be after minTime.");
    }
    if (!Number.isInteger(step) || step < 1) {
        throw new RangeError("Calendar step must be a positive integer.");
    }

    const effectiveDividerInterval = (
        dividerInterval >= step && dividerInterval % step === 0
    ) ? dividerInterval : step;
    const columns = buildColumns(days, resources);
    const firstDay = days[0];
    if (!firstDay) {
        throw new RangeError("A time-grid layout requires at least one day.");
    }
    const scaleStart = atDayTime(firstDay, minTime);
    const slotCount = Math.ceil(totalMinutes / step);
    const dividerCount = Math.ceil(totalMinutes / effectiveDividerInterval);
    const slots = Array.from({ length: slotCount }, (_, timeIndex) => {
        const time = addMinutes(scaleStart, timeIndex * step);

        return columns.map((column, columnIndex) => {
            const start = atDayTime(column.day, time);
            const duration = Math.min(step, totalMinutes - (timeIndex * step));
            const end = addMinutes(start, duration);
            const endMinute = Math.min((timeIndex + 1) * step, totalMinutes);

            return {
                key: `${timeIndex}-${column.key}`,
                start,
                end,
                duration,
                timeIndex,
                day: column.day,
                dayIndex: column.dayIndex,
                columnIndex,
                resource: column.resource,
                isDividerBoundary: endMinute !== totalMinutes
                    && endMinute % effectiveDividerInterval === 0
            };
        });
    }).flat();
    const dividers = Array.from({ length: dividerCount }, (_, index) => ({
        key: `${scaleStart.getTime()}-${index}`,
        time: addMinutes(scaleStart, index * effectiveDividerInterval),
        startRow: (index * effectiveDividerInterval) + 1,
        rowSpan: Math.min(
            effectiveDividerInterval,
            totalMinutes - (index * effectiveDividerInterval)
        )
    }));
    const segmentOptions = {
        columns,
        minTime,
        maxTime,
        getResourceId,
        getEventResourceIds
    };
    const eventSegments = segmentEvents<Event, Resource>({ ...segmentOptions, events });
    const backgroundSegments = segmentEvents({
        ...segmentOptions,
        events: backgroundEvents
    });

    return {
        columns,
        slots,
        dividers,
        events: sortEvents(assignLanes(eventSegments, columns)),
        backgroundEvents: backgroundSegments,
        totalMinutes,
        dividerInterval: effectiveDividerInterval
    };
};
