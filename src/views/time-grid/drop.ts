import { addMilliseconds } from "date-fns/addMilliseconds";

import type { CalendarEvent } from "../../types.js";
import type { TimeGridEventDrop } from "./types.js";
import type { LayoutEvent, LayoutSlot } from "./layout/types.js";

/**
 * Creates the application-facing result of dropping an event onto a slot.
 *
 * The source event supplies the duration so dragging a clipped segment never
 * shortens a multi-day event. Source and destination positions retain their
 * concrete resource values, including moves between resource columns.
 *
 * @param segment - Visible event segment that initiated the drag.
 * @param slot - Destination slot receiving the drop.
 * @returns Original event identity, moved boundaries, and both grid positions.
 */
export const createEventDrop = <
    Event extends CalendarEvent,
    Resource
>(
    segment: LayoutEvent<Event, Resource>,
    slot: LayoutSlot<Resource>
): TimeGridEventDrop<Event, Resource> => {
    const duration = segment.event.end.getTime() - segment.event.start.getTime();

    return {
        event: segment.event,
        start: slot.start,
        end: addMilliseconds(slot.start, duration),
        source: {
            day: segment.day,
            resource: segment.resource,
            resourceId: segment.resourceId
        },
        destination: {
            day: slot.day,
            resource: slot.resource,
            resourceId: slot.resourceId
        }
    };
};
