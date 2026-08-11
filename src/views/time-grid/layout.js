import { addMinutes } from "date-fns";

import { setTime } from "../../core/date.js";
import { sortEvents } from "../../core/events.js";

const defaultGetResourceId = (resource) => resource?.id;

const defaultGetEventResourceIds = (event) => {
    if (Array.isArray(event.resourceIds)) return event.resourceIds;
    if (event.resourceId != null) return [event.resourceId];
    if (event.resource?.id != null) return [event.resource.id];
    return [];
};

const wallClockMinutes = (date) => (date.getHours() * 60) + date.getMinutes();

const atDayTime = (day, time) => setTime(
    day,
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds()
);

const eventBelongsToColumn = ({
    event,
    column,
    getResourceId,
    getEventResourceIds
}) => {
    if (column.resource == null) return true;

    const resourceId = getResourceId(column.resource);
    return getEventResourceIds(event).includes(resourceId);
};

const buildColumns = (days, resources) => {
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

const segmentEvents = ({
    events,
    columns,
    minTime,
    maxTime,
    getResourceId,
    getEventResourceIds
}) => columns.flatMap((column, columnIndex) => {
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
});

const assignLanes = (events, columns) => {
    const eventsWithLanes = [];

    columns.forEach((_column, columnIndex) => {
        const columnEvents = sortEvents(events.filter(
            (event) => event.columnIndex === columnIndex
        ));
        let cluster = [];
        let clusterEnd = -1;
        let laneEnds = [];

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

export const createTimeGridLayout = ({
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
}) => {
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
    const scaleStart = atDayTime(days[0], minTime);
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
    const eventSegments = segmentEvents({ ...segmentOptions, events });
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
