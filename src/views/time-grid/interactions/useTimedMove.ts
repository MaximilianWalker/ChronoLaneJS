import { useCallback } from "react";
import type {
    PointerEvent,
    RefObject
} from "react";

import type { CalendarEvent } from "../../../types.js";
import type {
    LayoutColumn,
    LayoutEvent,
    LayoutSlot
} from "../layout/types.js";
import {
    createEventDrop,
    findEventMoveOrigin,
    findPointerMoveSlot
} from "../move.js";
import type { ViewProps } from "../types.js";
import type {
    InteractionDispatch,
    MoveState,
    TimedMoveInteractions
} from "./types.js";

interface Options<Event extends CalendarEvent, Resource> {
    move: MoveState<Event, Resource> | null;
    dispatch: InteractionDispatch<Event, Resource>;
    stageRef: RefObject<HTMLDivElement | null>;
    columns: LayoutColumn<Resource>[];
    slots: LayoutSlot<Resource>[];
    totalMinutes: number;
    slotDuration: number;
    onEventDrop?: ViewProps<Event, Resource>["onEventDrop"];
}

export const useTimedMove = <Event extends CalendarEvent, Resource>({
    move,
    dispatch,
    stageRef,
    columns,
    slots,
    totalMinutes,
    slotDuration,
    onEventDrop
}: Options<Event, Resource>): TimedMoveInteractions<Event, Resource> => {
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
            move?.pointerId !== interaction.pointerId
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
        if (move?.pointerId !== interaction.pointerId) return;

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
        if (move?.pointerId !== interaction.pointerId) return;

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
