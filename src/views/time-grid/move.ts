import { addMilliseconds } from "date-fns/addMilliseconds";

import type { CalendarEvent } from "../../types.js";
import type { LayoutEvent, LayoutSlot } from "./layout/types.js";
import type { EventDrop } from "./types.js";

export type MoveDirection = "up" | "down" | "left" | "right";

interface MovePosition {
    columnIndex: number;
    timeIndex: number;
    start: Date;
}

/** Returns the slot containing the visible start of an event occurrence. */
export const findEventMoveOrigin = <Event extends CalendarEvent, Resource>(
    slots: LayoutSlot<Resource>[],
    segment: LayoutEvent<Event, Resource>
): LayoutSlot<Resource> | undefined => (
    slots.find((slot) => (
        slot.columnIndex === segment.columnIndex
        && slot.start <= segment.start
        && slot.end > segment.start
    ))
    ?? slots.find((slot) => slot.columnIndex === segment.columnIndex)
);

/** Resolves the slot beneath a pointer position in the time-grid body. */
export const findPointerMoveSlot = <Resource>(
    slots: LayoutSlot<Resource>[],
    columnIndex: number,
    row: number,
    slotDuration: number
): LayoutSlot<Resource> | undefined => {
    const timeIndex = Math.round(Math.max(0, row - 1) / slotDuration);
    const columnSlots = slots.filter((slot) => slot.columnIndex === columnIndex);

    return columnSlots.find((slot) => slot.timeIndex === timeIndex)
        ?? columnSlots.at(-1);
};

/** Returns the next time or visual-column slot for keyboard movement. */
export const findAdjacentMoveSlot = <Resource>(
    slots: LayoutSlot<Resource>[],
    current: MovePosition,
    direction: MoveDirection
): LayoutSlot<Resource> | undefined => {
    if (direction === "left" || direction === "right") {
        const columnIndex = current.columnIndex + (direction === "left" ? -1 : 1);

        return slots.find((slot) => (
            slot.columnIndex === columnIndex
            && slot.timeIndex === current.timeIndex
        ));
    }

    const currentTime = current.start.getTime();
    const columnSlots = slots.filter(
        (slot) => slot.columnIndex === current.columnIndex
    );
    if (direction === "down") {
        return columnSlots.find((slot) => slot.start.getTime() > currentTime);
    }

    for (let index = columnSlots.length - 1; index >= 0; index -= 1) {
        const slot = columnSlots[index];
        if (slot != null && slot.start.getTime() < currentTime) return slot;
    }

    return undefined;
};

/** Builds the complete application-facing proposal for moving an event. */
export const createEventDrop = <
    Event extends CalendarEvent,
    Resource
>(
    segment: LayoutEvent<Event, Resource>,
    slot: LayoutSlot<Resource>
): EventDrop<Event, Resource> => {
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
