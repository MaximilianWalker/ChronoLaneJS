import { sortEvents } from "../../../core/events.js";
import type {
    CalendarEvent,
    CalendarResourceConfig,
    NormalizedCalendarEvent
} from "../../../types.js";
import {
    resolveCalendarEventResourceIds,
    resolveCalendarResources
} from "../resources.js";
import type { ResolvedCalendarResource } from "../resources.js";
import type {
    TimeGridColumn,
    TimeGridGroupBy,
    TimeGridLayout,
    TimeOfDay
} from "../types.js";
import { assignEventLanes, createEventSegments } from "./events.js";
import {
    createTimeScale,
    resolveTimeWindow
} from "./timeScale.js";

/** Builds one column per day, or an ordered day-resource cross product. */
const createColumns = <Resource>(
    days: Date[],
    resources: ResolvedCalendarResource<Resource>[],
    groupBy: TimeGridGroupBy
): TimeGridColumn<Resource>[] => {
    if (resources.length === 0) {
        return days.map((day, dayIndex) => ({
            key: `${day.getTime()}`,
            day,
            dayIndex,
            resource: null,
            resourceId: null,
            resourceIndex: null
        }));
    }

    const createColumn = (
        day: Date,
        dayIndex: number,
        { id, item }: ResolvedCalendarResource<Resource>,
        resourceIndex: number
    ): TimeGridColumn<Resource> => ({
        key: `${day.getTime()}-${typeof id}-${id}`,
        day,
        dayIndex,
        resource: item,
        resourceId: id,
        resourceIndex
    });

    return groupBy === "day"
        ? days.flatMap((day, dayIndex) => resources.map(
            (resource, resourceIndex) => createColumn(
                day,
                dayIndex,
                resource,
                resourceIndex
            )
        ))
        : resources.flatMap((resource, resourceIndex) => days.map(
            (day, dayIndex) => createColumn(
                day,
                dayIndex,
                resource,
                resourceIndex
            )
        ));
};

/** Inputs required to construct a complete time-grid layout. */
export interface CreateLayoutOptions<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    days: Date[];
    events: NormalizedCalendarEvent<Event>[];
    backgroundEvents: NormalizedCalendarEvent<Event>[];
    resources?: CalendarResourceConfig<Event, Resource>;
    groupBy?: TimeGridGroupBy;
    minTime: TimeOfDay;
    maxTime: TimeOfDay | "24:00";
    slotDuration: number;
    labelInterval: number;
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
    resources,
    groupBy = "day",
    minTime,
    maxTime,
    slotDuration,
    labelInterval
}: CreateLayoutOptions<Event, Resource>): TimeGridLayout<Event, Resource> => {
    const firstDay = days[0];
    if (!firstDay) {
        throw new RangeError("A time-grid layout requires at least one day.");
    }
    if (groupBy !== "day" && groupBy !== "resource") {
        throw new TypeError('groupBy must be either "day" or "resource".');
    }

    const columns = createColumns(
        days,
        resolveCalendarResources(resources),
        groupBy
    );
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
        getEventIds: (event: NormalizedCalendarEvent<Event>) => (
            resolveCalendarEventResourceIds(event, resources?.getEventIds)
        )
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
