import type { CalendarEvent } from "../../types.js";
import type {
    TimeGridColumn,
    TimeGridEventSegment,
    TimeGridSlot
} from "./types.js";
import type {
    LayoutColumn,
    LayoutEventSegment,
    LayoutSlot
} from "./layout/types.js";

export const toTimeGridColumn = <Resource>({
    day,
    resource,
    resourceId
}: LayoutColumn<Resource>): TimeGridColumn<Resource> => ({
    day,
    resource,
    resourceId
});

export const toTimeGridSlot = <Resource>({
    start,
    end,
    duration,
    day,
    resource,
    resourceId
}: LayoutSlot<Resource>): TimeGridSlot<Resource> => ({
    start,
    end,
    duration,
    day,
    resource,
    resourceId
});

export const toTimeGridEventSegment = <Event extends CalendarEvent, Resource>({
    start,
    end,
    day,
    resource,
    resourceId
}: LayoutEventSegment<Event, Resource>): TimeGridEventSegment<Resource> => ({
    start,
    end,
    day,
    resource,
    resourceId
});
