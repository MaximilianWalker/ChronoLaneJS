import type {
    Column,
    EventSegment,
    MultiDayEventLayout,
    Slot
} from "./types.js";
import type {
    LayoutColumn,
    LayoutSlot
} from "./layout/types.js";

export const toColumn = <Resource>({
    day,
    resource,
    resourceId
}: LayoutColumn<Resource>): Column<Resource> => ({
    day,
    resource,
    resourceId
});

export const toSlot = <Resource>({
    start,
    end,
    duration,
    day,
    resource,
    resourceId
}: LayoutSlot<Resource>): Slot<Resource> => ({
    start,
    end,
    duration,
    day,
    resource,
    resourceId
});

export const toEventSegment = <Resource>(
    segment: Omit<EventSegment<Resource>, "layout">,
    layout: MultiDayEventLayout = "timed"
): EventSegment<Resource> => {
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
