import type {
    TimeGridColumn,
    TimeGridEventSegment,
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
    segment: TimeGridEventSegment<Resource>
): TimeGridEventSegment<Resource> => {
    const { start, end, day, resource, resourceId } = segment;

    return {
        start,
        end,
        day,
        resource,
        resourceId
    };
};
