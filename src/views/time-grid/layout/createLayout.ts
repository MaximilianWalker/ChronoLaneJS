import { sortEvents } from "../../../core/events.js";
import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../../types.js";
import {
    getDefaultEventResourceIds,
    getDefaultResourceId
} from "../resources.js";
import type {
    TimeGridColumn,
    TimeGridLayout,
    TimeOfDay
} from "../types.js";
import { assignEventLanes, createEventSegments } from "./events.js";
import {
    createTimeScale,
    resolveTimeWindow
} from "./timeScale.js";

/** Builds one column per day, or one column per day-resource pair. */
const createColumns = <Resource>(
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

/** Inputs required to construct a complete time-grid layout. */
export interface CreateLayoutOptions<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    days: Date[];
    events: NormalizedCalendarEvent<Event>[];
    backgroundEvents: NormalizedCalendarEvent<Event>[];
    resources?: Resource[];
    minTime: TimeOfDay;
    maxTime: TimeOfDay | "24:00";
    slotDuration: number;
    labelInterval: number;
    getResourceId?: (resource: Resource) => unknown;
    getEventResourceIds?: (event: NormalizedCalendarEvent<Event>) => unknown[];
}

/**
 * Constructs the columns, time scale, visible event segments, and overlap
 * lanes required to render a time grid.
 *
 * @param options - Visible days, events, resources, time bounds, and accessors.
 * @returns A complete immutable-by-convention layout model for the grid.
 * @throws RangeError if no day is supplied or the time scale is invalid.
 */
export const createLayout = <Event extends CalendarEvent, Resource>({
    days,
    events,
    backgroundEvents,
    resources = [],
    minTime,
    maxTime,
    slotDuration,
    labelInterval,
    getResourceId = getDefaultResourceId,
    getEventResourceIds = getDefaultEventResourceIds
}: CreateLayoutOptions<Event, Resource>): TimeGridLayout<Event, Resource> => {
    const firstDay = days[0];
    if (!firstDay) {
        throw new RangeError("A time-grid layout requires at least one day.");
    }

    const columns = createColumns(days, resources);
    const timeWindow = resolveTimeWindow(minTime, maxTime);
    const timeScale = createTimeScale({
        firstDay,
        columns,
        timeWindow,
        slotDuration,
        labelInterval
    });
    const segmentOptions = {
        columns,
        timeWindow,
        getResourceId,
        getEventResourceIds
    };
    const eventSegments = createEventSegments<Event, Resource>({
        ...segmentOptions,
        events
    });
    const backgroundSegments = createEventSegments({
        ...segmentOptions,
        events: backgroundEvents
    });

    return {
        columns,
        ...timeScale,
        events: sortEvents(assignEventLanes(eventSegments, columns.length)),
        backgroundEvents: backgroundSegments
    };
};
