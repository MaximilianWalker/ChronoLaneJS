import { useCallback } from "react";
import type {
    PointerEvent,
    RefObject
} from "react";

import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../types.js";
import type {
    InteractionDispatch,
    MoveState,
    ResizeState,
    TimedInteractions
} from "./interactions.js";
import type {
    LayoutColumn,
    LayoutEvent,
    LayoutSlot
} from "./layout/types.js";
import {
    createEventDrop,
    findEventMoveOrigin,
    findPointerMoveSlot
} from "./move.js";
import {
    createEventResize,
    findClosestResizeBoundary
} from "./resize.js";
import type { ResizeBoundary } from "./resize.js";
import type {
    EventResizeEdge,
    ViewProps
} from "./types.js";

interface UseTimedInteractionsOptions<
    Event extends CalendarEvent,
    Resource
> {
    move: MoveState<Event, Resource> | null;
    resize: ResizeState<Event, Resource> | null;
    dispatch: InteractionDispatch<Event, Resource>;
    stageRef: RefObject<HTMLDivElement | null>;
    columns: LayoutColumn<Resource>[];
    slots: LayoutSlot<Resource>[];
    totalMinutes: number;
    slotDuration: number;
    onEventDrop?: ViewProps<Event, Resource>["onEventDrop"];
    onEventResize?: ViewProps<Event, Resource>["onEventResize"];
}

/** Creates the controller for timed movement and resizing. */
export const useTimedInteractions = <Event extends CalendarEvent, Resource>({
    move,
    resize,
    dispatch,
    stageRef,
    columns,
    slots,
    totalMinutes,
    slotDuration,
    onEventDrop,
    onEventResize
}: UseTimedInteractionsOptions<Event, Resource>): TimedInteractions<Event, Resource> => {
    const beginMove = useCallback((
        segment: LayoutEvent<Event, Resource>,
        handleKey: string,
        pointerId?: number
    ): MoveState<Event, Resource> | null => {
        const origin = findEventMoveOrigin(slots, segment);
        if (!origin) return null;

        const next = {
            kind: "move",
            segment,
            origin,
            handleKey,
            pointerId
        } satisfies MoveState<Event, Resource>;
        dispatch({ type: "begin", interaction: next });
        return next;
    }, [dispatch, slots]);

    const updateMoveTarget = useCallback((
        current: MoveState<Event, Resource>,
        target: LayoutSlot<Resource>,
        keepOrigin = false
    ) => {
        const nextTarget = !keepOrigin && target.key === current.origin.key
            ? undefined
            : target;
        if (current.target?.key === nextTarget?.key) return;

        dispatch({
            type: "update",
            interaction: { ...current, target: nextTarget }
        });
    }, [dispatch]);

    const cancelMove = useCallback(() => {
        if (move) dispatch({ type: "finish", interaction: move });
    }, [dispatch, move]);

    const commitMove = useCallback((current: MoveState<Event, Resource> | null) => {
        if (!current) return;
        dispatch({ type: "finish", interaction: current });
        if (!current.target || !onEventDrop) return;
        if (
            current.target.start.getTime() === current.segment.event.start.getTime()
            && current.target.resourceId === current.segment.resourceId
        ) return;

        onEventDrop(createEventDrop(current.segment, current.target));
    }, [dispatch, onEventDrop]);

    const handleMovePointerMove = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const grid = stageRef.current;
        if (
            !move
            || move.pointerId !== interaction.pointerId
            || !grid
            || columns.length === 0
        ) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        const bounds = grid.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) return;

        const columnIndex = Math.min(
            columns.length - 1,
            Math.max(0, Math.floor(
                (interaction.clientX - bounds.left) / bounds.width * columns.length
            ))
        );
        const row = 1 + Math.min(
            totalMinutes - Number.EPSILON,
            Math.max(0, (interaction.clientY - bounds.top) / bounds.height * totalMinutes)
        );
        const target = findPointerMoveSlot(
            slots,
            columnIndex,
            row,
            slotDuration
        );
        if (target) updateMoveTarget(move, target);
    }, [
        columns.length,
        move,
        slotDuration,
        slots,
        stageRef,
        totalMinutes,
        updateMoveTarget
    ]);

    const handleMovePointerUp = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        if (!move || move.pointerId !== interaction.pointerId) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        if (interaction.currentTarget.hasPointerCapture(interaction.pointerId)) {
            interaction.currentTarget.releasePointerCapture(interaction.pointerId);
        }
        commitMove(move);
    }, [commitMove, move]);

    const handleMovePointerCancel = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        if (!move || move.pointerId !== interaction.pointerId) return;

        interaction.stopPropagation();
        cancelMove();
    }, [cancelMove, move]);

    const beginResize = useCallback((
        event: NormalizedCalendarEvent<Event>,
        segment: LayoutEvent<Event, Resource>,
        edge: EventResizeEdge,
        handleKey: string,
        boundaries: ResizeBoundary<Resource>[],
        pointerId?: number
    ): ResizeState<Event, Resource> | null => {
        if (boundaries.length === 0) return null;

        const next = {
            kind: "resize",
            event,
            edge,
            source: {
                day: segment.day,
                resource: segment.resource,
                resourceId: segment.resourceId
            },
            boundaries,
            handleKey,
            pointerId
        } satisfies ResizeState<Event, Resource>;
        dispatch({ type: "begin", interaction: next });
        return next;
    }, [dispatch]);

    const updateResize = useCallback((next: ResizeState<Event, Resource>) => {
        dispatch({ type: "update", interaction: next });
    }, [dispatch]);

    const cancelResize = useCallback(() => {
        if (resize) dispatch({ type: "finish", interaction: resize });
    }, [dispatch, resize]);

    const commitResize = useCallback((current: ResizeState<Event, Resource> | null) => {
        if (!current) return;
        dispatch({ type: "finish", interaction: current });
        if (!current.target || !onEventResize) return;

        const originalBoundary = current.edge === "start"
            ? current.event.start
            : current.event.end;
        if (current.target.date.getTime() === originalBoundary.getTime()) return;

        onEventResize(createEventResize(
            current.event,
            current.edge,
            current.target,
            current.source
        ));
    }, [dispatch, onEventResize]);

    const handleResizePointerMove = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const grid = stageRef.current;
        if (
            !resize
            || resize.pointerId !== interaction.pointerId
            || !grid
            || columns.length === 0
        ) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        const bounds = grid.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) return;

        const rawColumnIndex = Math.min(
            columns.length - 1,
            Math.max(0, Math.floor(
                (interaction.clientX - bounds.left) / bounds.width * columns.length
            ))
        );
        const pointerColumn = columns[rawColumnIndex];
        if (!pointerColumn) return;

        const targetColumnIndex = columns.findIndex((column) => (
            column.dayIndex === pointerColumn.dayIndex
            && column.resourceId === resize.source.resourceId
        ));
        if (targetColumnIndex === -1) return;

        const row = 1 + Math.min(
            totalMinutes,
            Math.max(0, (interaction.clientY - bounds.top) / bounds.height * totalMinutes)
        );
        const target = findClosestResizeBoundary(
            resize.boundaries,
            targetColumnIndex,
            row,
            resize.edge
        );
        if (!target || resize.target === target) return;

        updateResize({ ...resize, target });
    }, [columns, resize, stageRef, totalMinutes, updateResize]);

    const handleResizePointerUp = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        if (!resize || resize.pointerId !== interaction.pointerId) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        if (interaction.currentTarget.hasPointerCapture(interaction.pointerId)) {
            interaction.currentTarget.releasePointerCapture(interaction.pointerId);
        }
        commitResize(resize);
    }, [commitResize, resize]);

    const handleResizePointerCancel = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        if (!resize || resize.pointerId !== interaction.pointerId) return;

        interaction.stopPropagation();
        cancelResize();
    }, [cancelResize, resize]);

    const timed: TimedInteractions<Event, Resource> = {
        move,
        resize,
        beginMove,
        updateMoveTarget,
        cancelMove,
        commitMove,
        handleMovePointerMove,
        handleMovePointerUp,
        handleMovePointerCancel,
        beginResize,
        updateResize,
        cancelResize,
        commitResize,
        handleResizePointerMove,
        handleResizePointerUp,
        handleResizePointerCancel
    };
    return timed;
};
