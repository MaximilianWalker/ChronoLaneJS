import type {
    KeyboardEvent,
    PointerEvent
} from "react";

import type { CalendarEvent } from "../../../types.js";
import type { LayoutMultiDayEvent } from "../layout/multiDayEvents.js";
import type { LayoutColumn } from "../layout/types.js";
import type { EventResizeEdge } from "../types.js";
import type { MultiDayInteractions } from "./types.js";

interface MoveOptions<Event extends CalendarEvent, Resource> {
    segment: LayoutMultiDayEvent<Event, Resource>;
    handleKey: string;
    columns: LayoutColumn<Resource>[];
    interactions: MultiDayInteractions<Event, Resource>;
}

export const handleMultiDayMoveBlur = <
    Event extends CalendarEvent,
    Resource
>(
    handleKey: string,
    interactions: MultiDayInteractions<Event, Resource>
): void => {
    if (interactions.move?.handleKey === handleKey) {
        interactions.commitMove(interactions.move);
    }
};

export const handleMultiDayMoveKeyDown = <
    Event extends CalendarEvent,
    Resource
>(
    interaction: KeyboardEvent<HTMLElement>,
    { segment, handleKey, columns, interactions }: MoveOptions<Event, Resource>
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
    if (
        interaction.key !== "ArrowLeft"
        && interaction.key !== "ArrowRight"
    ) return;

    interaction.preventDefault();
    const nextState = current ?? interactions.beginMove(segment, handleKey);
    if (!nextState) return;
    const currentColumn = nextState.target ?? nextState.origin;
    const currentIndex = columns.indexOf(currentColumn);
    const target = columns[
        currentIndex + (interaction.key === "ArrowLeft" ? -1 : 1)
    ];
    if (target) interactions.updateMoveTarget(nextState, target);
};

export const handleMultiDayMovePointerDown = <
    Event extends CalendarEvent,
    Resource
>(
    interaction: PointerEvent<HTMLElement>,
    { segment, handleKey, interactions }: MoveOptions<Event, Resource>
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
    if (next && interaction.nativeEvent.isTrusted) {
        interaction.currentTarget.setPointerCapture(interaction.pointerId);
    }
};

interface ResizeOptions<Event extends CalendarEvent, Resource> {
    segment: LayoutMultiDayEvent<Event, Resource>;
    edge: EventResizeEdge;
    handleKey: string;
    dayOffsets: number[];
    interactions: MultiDayInteractions<Event, Resource>;
}

export const handleMultiDayResizeBlur = <
    Event extends CalendarEvent,
    Resource
>(
    handleKey: string,
    interactions: MultiDayInteractions<Event, Resource>
): void => {
    if (interactions.resize?.handleKey === handleKey) {
        interactions.commitResize(interactions.resize);
    }
};

export const handleMultiDayResizeKeyDown = <
    Event extends CalendarEvent,
    Resource
>(
    interaction: KeyboardEvent<HTMLElement>,
    {
        segment,
        edge,
        handleKey,
        dayOffsets,
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
    if (
        interaction.key !== "ArrowLeft"
        && interaction.key !== "ArrowRight"
    ) return;

    interaction.preventDefault();
    const nextState = current ?? interactions.beginResize(
        segment,
        edge,
        handleKey,
        dayOffsets
    );
    if (!nextState) return;
    const offset = nextState.targetOffset ?? 0;
    const nextOffset = interaction.key === "ArrowLeft"
        ? [...nextState.dayOffsets].reverse().find((value) => value < offset)
        : nextState.dayOffsets.find((value) => value > offset);
    if (nextOffset == null) return;
    interactions.updateResize({
        ...nextState,
        targetOffset: nextOffset === 0 ? undefined : nextOffset
    });
};

export const handleMultiDayResizePointerDown = <
    Event extends CalendarEvent,
    Resource
>(
    interaction: PointerEvent<HTMLElement>,
    options: ResizeOptions<Event, Resource>
): void => {
    interaction.preventDefault();
    interaction.stopPropagation();
    const next = options.interactions.beginResize(
        options.segment,
        options.edge,
        options.handleKey,
        options.dayOffsets,
        interaction.pointerId
    );
    if (next && interaction.nativeEvent.isTrusted) {
        interaction.currentTarget.setPointerCapture(interaction.pointerId);
    }
};
