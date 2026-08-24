import type {
    KeyboardEvent,
    PointerEvent
} from "react";

import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../../types.js";
import type {
    LayoutEvent,
    LayoutSlot
} from "../layout/types.js";
import { findAdjacentMoveSlot } from "../move.js";
import { findAdjacentResizeBoundary } from "../resize.js";
import type { ResizeBoundary } from "../resize.js";
import type { EventResizeEdge } from "../types.js";
import type { TimedInteractions } from "./types.js";

interface MoveOptions<Event extends CalendarEvent, Resource> {
    segment: LayoutEvent<Event, Resource>;
    handleKey: string;
    slots: LayoutSlot<Resource>[];
    interactions: TimedInteractions<Event, Resource>;
}

export const handleTimedMoveBlur = <Event extends CalendarEvent, Resource>(
    handleKey: string,
    interactions: TimedInteractions<Event, Resource>
): void => {
    if (interactions.move?.handleKey === handleKey) {
        interactions.commitMove(interactions.move);
    }
};

export const handleTimedMoveKeyDown = <
    Event extends CalendarEvent,
    Resource
>(
    interaction: KeyboardEvent<HTMLElement>,
    { segment, handleKey, slots, interactions }: MoveOptions<Event, Resource>
): void => {
    interaction.stopPropagation();
    const current = interactions.move?.handleKey === handleKey
        ? interactions.move
        : null;

    if (interaction.key === "Escape" && current) {
        interaction.preventDefault();
        interactions.cancelMove();
        return;
    }
    if (interaction.key === "Enter" && current) {
        interaction.preventDefault();
        interactions.commitMove(current);
        return;
    }

    const direction = interaction.key === "ArrowUp"
        ? "up"
        : interaction.key === "ArrowDown"
            ? "down"
            : interaction.key === "ArrowLeft"
                ? "left"
                : interaction.key === "ArrowRight"
                    ? "right"
                    : null;
    if (direction == null) return;

    interaction.preventDefault();
    const nextState = current ?? interactions.beginMove(segment, handleKey);
    if (!nextState) return;

    const position = nextState.target ?? nextState.origin;
    const target = findAdjacentMoveSlot(slots, {
        columnIndex: position.columnIndex,
        timeIndex: position.timeIndex,
        start: nextState.target?.start ?? segment.start
    }, direction);
    if (target) interactions.updateMoveTarget(nextState, target, true);
};

export const handleTimedMovePointerDown = <
    Event extends CalendarEvent,
    Resource
>(
    interaction: PointerEvent<HTMLElement>,
    segment: LayoutEvent<Event, Resource>,
    handleKey: string,
    interactions: TimedInteractions<Event, Resource>
): void => {
    interaction.stopPropagation();
    const next = interactions.beginMove(
        segment,
        handleKey,
        {
            pointerId: interaction.pointerId,
            clientX: interaction.clientX,
            clientY: interaction.clientY
        }
    );
    if (!next) return;

    if (interaction.nativeEvent.isTrusted) {
        interaction.currentTarget.setPointerCapture(interaction.pointerId);
    }
};

interface ResizeOptions<Event extends CalendarEvent, Resource> {
    event: NormalizedCalendarEvent<Event>;
    segment: LayoutEvent<Event, Resource>;
    edge: EventResizeEdge;
    handleKey: string;
    boundaries: ResizeBoundary<Resource>[];
    interactions: TimedInteractions<Event, Resource>;
}

export const handleTimedResizeBlur = <Event extends CalendarEvent, Resource>(
    handleKey: string,
    interactions: TimedInteractions<Event, Resource>
): void => {
    if (interactions.resize?.handleKey === handleKey) {
        interactions.commitResize(interactions.resize);
    }
};

export const handleTimedResizeKeyDown = <
    Event extends CalendarEvent,
    Resource
>(
    interaction: KeyboardEvent<HTMLElement>,
    {
        event,
        segment,
        edge,
        handleKey,
        boundaries,
        interactions
    }: ResizeOptions<Event, Resource>
): void => {
    interaction.stopPropagation();
    const current = interactions.resize?.handleKey === handleKey
        ? interactions.resize
        : null;

    if (interaction.key === "Escape" && current) {
        interaction.preventDefault();
        interactions.cancelResize();
        return;
    }
    if (interaction.key === "Enter" && current) {
        interaction.preventDefault();
        interactions.commitResize(current);
        return;
    }

    const direction = interaction.key === "ArrowUp"
        || interaction.key === "ArrowLeft"
        ? -1
        : interaction.key === "ArrowDown"
            || interaction.key === "ArrowRight"
            ? 1
            : null;
    if (direction == null) return;

    interaction.preventDefault();
    const nextState = current ?? interactions.beginResize(
        event,
        segment,
        edge,
        handleKey,
        boundaries
    );
    if (!nextState) return;

    const adjacent = findAdjacentResizeBoundary(
        nextState.boundaries,
        nextState.target?.date ?? event[edge],
        direction
    );
    if (adjacent) {
        interactions.updateResize({ ...nextState, target: adjacent });
    }
};

export const handleTimedResizePointerDown = <
    Event extends CalendarEvent,
    Resource
>(
    interaction: PointerEvent<HTMLElement>,
    options: ResizeOptions<Event, Resource>
): void => {
    interaction.preventDefault();
    interaction.stopPropagation();
    const next = options.interactions.beginResize(
        options.event,
        options.segment,
        options.edge,
        options.handleKey,
        options.boundaries,
        interaction.pointerId
    );
    if (!next) return;

    if (interaction.nativeEvent.isTrusted) {
        interaction.currentTarget.setPointerCapture(interaction.pointerId);
    }
};
