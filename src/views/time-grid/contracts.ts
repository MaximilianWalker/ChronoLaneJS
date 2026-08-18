import type {
    TimeGridColumn,
    TimeGridEventSegment,
    TimeGridMultiDayEventLayout,
    TimeGridSlot
} from "./types.js";
import type {
    LayoutColumn,
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

export const toTimeGridEventSegment = <Resource>(
    segment: Omit<TimeGridEventSegment<Resource>, "layout">,
    layout: TimeGridMultiDayEventLayout = "timed"
): TimeGridEventSegment<Resource> => {
    const { start, end, day, resource, resourceId } = segment;

    return {
        layout,
        start,
        end,
        day,
        resource,
        resourceId
    };
};
