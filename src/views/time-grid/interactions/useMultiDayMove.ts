import { useCallback } from "react";
import type {
    PointerEvent,
    RefObject
} from "react";

import type { CalendarEvent } from "../../../types.js";
import {
    createMultiDayEventDrop,
    getMultiDayMoveTargetIndex,
    getMultiDayPointerColumnIndex
} from "../layout/multiDayEvents.js";
import type { LayoutMultiDayEvent } from "../layout/multiDayEvents.js";
import type { LayoutColumn } from "../layout/types.js";
import type { ViewProps } from "../types.js";
import type {
    InteractionDispatch,
    MultiDayMoveInteractions,
    MultiDayMoveState,
    PointerStart
} from "./types.js";
import {
    exceedsDragThreshold,
    suppressNextClick
} from "./pointerDrag.js";

interface Options<Event extends CalendarEvent, Resource> {
    move: MultiDayMoveState<Event, Resource> | null;
    dispatch: InteractionDispatch<Event, Resource>;
    gridRef: RefObject<HTMLDivElement | null>;
    columns: LayoutColumn<Resource>[];
    onEventDrop?: ViewProps<Event, Resource>["onEventDrop"];
}

export const useMultiDayMove = <Event extends CalendarEvent, Resource>({
    move,
    dispatch,
    gridRef,
    columns,
    onEventDrop
}: Options<Event, Resource>): MultiDayMoveInteractions<Event, Resource> => {
    const beginMove = useCallback((
        segment: LayoutMultiDayEvent<Event, Resource>,
        handleKey: string,
        pointer?: PointerStart
    ): MultiDayMoveState<Event, Resource> | null => {
        const origin = columns[segment.columnIndex];
        if (!origin) return null;

        const grid = gridRef.current;
        const bounds = grid?.getBoundingClientRect();
        const grabColumnIndex = pointer && bounds
            ? getMultiDayPointerColumnIndex(
                pointer.clientX,
                bounds.left,
                bounds.width,
                columns.length
            )
            : undefined;
        if (pointer && grabColumnIndex == null) return null;

        const next = {
            kind: "multi-day-move",
            segment,
            origin,
            handleKey,
            pointer: pointer && {
                ...pointer,
                dragging: false,
                grabColumnIndex: grabColumnIndex!
            }
        } satisfies MultiDayMoveState<Event, Resource>;
        dispatch({ type: "begin", interaction: next });
        return next;
    }, [columns, dispatch, gridRef]);

    const updateMoveTarget = useCallback((
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

    const cancelMove = useCallback(() => {
        if (move) dispatch({ type: "finish", interaction: move });
    }, [dispatch, move]);

    const commitMove = useCallback((
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

    const handleMovePointerMove = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const grid = gridRef.current;
        if (
            move?.pointer?.pointerId !== interaction.pointerId
            || !grid
            || columns.length === 0
        ) return;

        const dragging = move.pointer.dragging || exceedsDragThreshold(
            move.pointer,
            interaction
        );
        if (!dragging) return;

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
            move.segment.columnIndex,
            move.pointer.grabColumnIndex,
            columnIndex,
            columns.length
        );
        const target = targetIndex == null ? undefined : columns[targetIndex];
        if (!target) return;

        const nextTarget = target.key === move.origin.key ? undefined : target;
        if (
            move.pointer.dragging
            && move.target?.key === nextTarget?.key
        ) return;

        dispatch({
            type: "update",
            interaction: {
                ...move,
                pointer: { ...move.pointer, dragging: true },
                target: nextTarget
            }
        });
    }, [columns, dispatch, gridRef, move]);

    const handleMovePointerUp = useCallback((
        interaction: PointerEvent<HTMLElement>
    ): boolean => {
        if (move?.pointer?.pointerId !== interaction.pointerId) return false;

        const dragged = move.pointer.dragging;
        if (dragged) {
            interaction.preventDefault();
            interaction.stopPropagation();
            suppressNextClick(interaction.currentTarget);
        }
        if (interaction.currentTarget.hasPointerCapture(interaction.pointerId)) {
            interaction.currentTarget.releasePointerCapture(interaction.pointerId);
        }
        commitMove(move);
        return dragged;
    }, [commitMove, move]);

    const handleMovePointerCancel = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        if (move?.pointer?.pointerId !== interaction.pointerId) return;
        interaction.stopPropagation();
        cancelMove();
    }, [cancelMove, move]);

    return {
        move,
        beginMove,
        updateMoveTarget,
        cancelMove,
        commitMove,
        handleMovePointerMove,
        handleMovePointerUp,
        handleMovePointerCancel
    };
};
