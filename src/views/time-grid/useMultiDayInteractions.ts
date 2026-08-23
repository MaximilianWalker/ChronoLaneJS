import { useCallback } from "react";
import type {
    PointerEvent,
    RefObject
} from "react";

import type { CalendarEvent } from "../../types.js";
import type {
    InteractionDispatch,
    MultiDayInteractions,
    MultiDayMoveState,
    MultiDayResizeState
} from "./interactions.js";
import {
    createMultiDayEventDrop,
    createMultiDayEventResize,
    getMultiDayMoveTargetIndex,
    getMultiDayPointerColumnIndex,
    getMultiDayResizeOffset
} from "./layout/multiDayEvents.js";
import type { LayoutMultiDayEvent } from "./layout/multiDayEvents.js";
import type { LayoutColumn } from "./layout/types.js";
import type {
    EventResizeEdge,
    ViewProps
} from "./types.js";

interface UseMultiDayInteractionsOptions<
    Event extends CalendarEvent,
    Resource
> {
    move: MultiDayMoveState<Event, Resource> | null;
    resize: MultiDayResizeState<Event, Resource> | null;
    dispatch: InteractionDispatch<Event, Resource>;
    gridRef: RefObject<HTMLDivElement | null>;
    columns: LayoutColumn<Resource>[];
    onEventDrop?: ViewProps<Event, Resource>["onEventDrop"];
    onEventResize?: ViewProps<Event, Resource>["onEventResize"];
}

/** Creates the controller for dedicated multi-day movement and resizing. */
export const useMultiDayInteractions = <Event extends CalendarEvent, Resource>({
    move: multiDayMove,
    resize: multiDayResize,
    dispatch,
    gridRef: multiDayRef,
    columns,
    onEventDrop,
    onEventResize
}: UseMultiDayInteractionsOptions<Event, Resource>): MultiDayInteractions<Event, Resource> => {
    const beginMultiDayMove = useCallback((
        segment: LayoutMultiDayEvent<Event, Resource>,
        handleKey: string,
        pointerId?: number,
        grabColumnIndex?: number
    ): MultiDayMoveState<Event, Resource> | null => {
        const origin = columns[segment.columnIndex];
        if (!origin) return null;

        const next = {
            kind: "multi-day-move",
            segment,
            origin,
            handleKey,
            pointerId,
            grabColumnIndex
        } satisfies MultiDayMoveState<Event, Resource>;
        dispatch({ type: "begin", interaction: next });
        return next;
    }, [columns, dispatch]);

    const updateMultiDayMoveTarget = useCallback((
        current: MultiDayMoveState<Event, Resource>,
        target: LayoutColumn<Resource>
    ) => {
        const nextTarget = target.key === current.origin.key ? undefined : target;
        if (current.target?.key === nextTarget?.key) return;
        dispatch({
            type: "update",
            interaction: { ...current, target: nextTarget }
        });
    }, [dispatch]);

    const cancelMultiDayMove = useCallback(() => {
        if (multiDayMove) {
            dispatch({ type: "finish", interaction: multiDayMove });
        }
    }, [dispatch, multiDayMove]);

    const commitMultiDayMove = useCallback((
        current: MultiDayMoveState<Event, Resource> | null
    ) => {
        if (!current) return;
        dispatch({ type: "finish", interaction: current });
        if (!current.target || !onEventDrop) return;
        if (
            current.target.day.getTime() === current.origin.day.getTime()
            && current.target.resourceId === current.origin.resourceId
        ) return;

        onEventDrop(createMultiDayEventDrop(current.segment, current.target));
    }, [dispatch, onEventDrop]);

    const handleMultiDayMovePointerMove = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const grid = multiDayRef.current;
        if (
            !multiDayMove
            || multiDayMove.pointerId !== interaction.pointerId
            || multiDayMove.grabColumnIndex == null
            || !grid
            || columns.length === 0
        ) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        const bounds = grid.getBoundingClientRect();
        if (bounds.width <= 0) return;
        const columnIndex = getMultiDayPointerColumnIndex(
            interaction.clientX,
            bounds.left,
            bounds.width,
            columns.length
        );
        if (columnIndex == null) return;
        const targetIndex = getMultiDayMoveTargetIndex(
            multiDayMove.segment.columnIndex,
            multiDayMove.grabColumnIndex,
            columnIndex,
            columns.length
        );
        const target = targetIndex == null ? undefined : columns[targetIndex];
        if (target) updateMultiDayMoveTarget(multiDayMove, target);
    }, [columns, multiDayMove, multiDayRef, updateMultiDayMoveTarget]);

    const handleMultiDayMovePointerUp = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        if (!multiDayMove || multiDayMove.pointerId !== interaction.pointerId) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        if (interaction.currentTarget.hasPointerCapture(interaction.pointerId)) {
            interaction.currentTarget.releasePointerCapture(interaction.pointerId);
        }
        commitMultiDayMove(multiDayMove);
    }, [commitMultiDayMove, multiDayMove]);

    const handleMultiDayMovePointerCancel = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        if (multiDayMove?.pointerId !== interaction.pointerId) return;
        interaction.stopPropagation();
        cancelMultiDayMove();
    }, [cancelMultiDayMove, multiDayMove]);

    const beginMultiDayResize = useCallback((
        segment: LayoutMultiDayEvent<Event, Resource>,
        edge: EventResizeEdge,
        handleKey: string,
        dayOffsets: number[],
        pointerId?: number
    ): MultiDayResizeState<Event, Resource> | null => {
        if (dayOffsets.length === 0) return null;

        const next = {
            kind: "multi-day-resize",
            segment,
            edge,
            source: {
                day: segment.day,
                resource: segment.resource,
                resourceId: segment.resourceId
            },
            dayOffsets,
            handleKey,
            pointerId
        } satisfies MultiDayResizeState<Event, Resource>;
        dispatch({ type: "begin", interaction: next });
        return next;
    }, [dispatch]);

    const updateMultiDayResize = useCallback((
        next: MultiDayResizeState<Event, Resource>
    ) => {
        dispatch({ type: "update", interaction: next });
    }, [dispatch]);

    const cancelMultiDayResize = useCallback(() => {
        if (multiDayResize) {
            dispatch({ type: "finish", interaction: multiDayResize });
        }
    }, [dispatch, multiDayResize]);

    const commitMultiDayResize = useCallback((
        current: MultiDayResizeState<Event, Resource> | null
    ) => {
        if (!current) return;
        dispatch({ type: "finish", interaction: current });
        if (current.targetOffset == null || !onEventResize) return;

        onEventResize(createMultiDayEventResize({
            event: current.segment.event,
            edge: current.edge,
            dayOffset: current.targetOffset,
            source: current.source
        }));
    }, [dispatch, onEventResize]);

    const handleMultiDayResizePointerMove = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const grid = multiDayRef.current;
        if (
            !multiDayResize
            || multiDayResize.pointerId !== interaction.pointerId
            || !grid
            || columns.length === 0
        ) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        const bounds = grid.getBoundingClientRect();
        if (bounds.width <= 0) return;
        const rawColumnIndex = getMultiDayPointerColumnIndex(
            interaction.clientX,
            bounds.left,
            bounds.width,
            columns.length
        );
        if (rawColumnIndex == null) return;
        const pointerColumn = columns[rawColumnIndex];
        if (!pointerColumn) return;
        const targetColumn = columns.find((column) => (
            column.dayIndex === pointerColumn.dayIndex
            && column.resourceId === multiDayResize.source.resourceId
        ));
        if (!targetColumn) return;
        const targetOffset = getMultiDayResizeOffset(
            multiDayResize.segment.event,
            multiDayResize.edge,
            targetColumn.day
        );
        if (
            !multiDayResize.dayOffsets.includes(targetOffset)
            || multiDayResize.targetOffset === targetOffset
        ) return;

        updateMultiDayResize({
            ...multiDayResize,
            targetOffset: targetOffset === 0 ? undefined : targetOffset
        });
    }, [columns, multiDayRef, multiDayResize, updateMultiDayResize]);

    const handleMultiDayResizePointerUp = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        if (
            !multiDayResize
            || multiDayResize.pointerId !== interaction.pointerId
        ) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        if (interaction.currentTarget.hasPointerCapture(interaction.pointerId)) {
            interaction.currentTarget.releasePointerCapture(interaction.pointerId);
        }
        commitMultiDayResize(multiDayResize);
    }, [commitMultiDayResize, multiDayResize]);

    const handleMultiDayResizePointerCancel = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        if (multiDayResize?.pointerId !== interaction.pointerId) return;
        interaction.stopPropagation();
        cancelMultiDayResize();
    }, [cancelMultiDayResize, multiDayResize]);

    const multiDay: MultiDayInteractions<Event, Resource> = {
        move: multiDayMove,
        resize: multiDayResize,
        beginMove: beginMultiDayMove,
        updateMoveTarget: updateMultiDayMoveTarget,
        cancelMove: cancelMultiDayMove,
        commitMove: commitMultiDayMove,
        handleMovePointerMove: handleMultiDayMovePointerMove,
        handleMovePointerUp: handleMultiDayMovePointerUp,
        handleMovePointerCancel: handleMultiDayMovePointerCancel,
        beginResize: beginMultiDayResize,
        updateResize: updateMultiDayResize,
        cancelResize: cancelMultiDayResize,
        commitResize: commitMultiDayResize,
        handleResizePointerMove: handleMultiDayResizePointerMove,
        handleResizePointerUp: handleMultiDayResizePointerUp,
        handleResizePointerCancel: handleMultiDayResizePointerCancel
    };

    return multiDay;
};
