import { useCallback } from "react";
import type {
    PointerEvent,
    RefObject
} from "react";

import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../../types.js";
import type {
    LayoutColumn,
    LayoutEvent
} from "../layout/types.js";
import {
    createEventResize,
    findClosestResizeBoundary
} from "../resize.js";
import type { ResizeBoundary } from "../resize.js";
import type {
    EventResizeEdge,
    ViewProps
} from "../types.js";
import type {
    InteractionDispatch,
    ResizeState,
    TimedResizeInteractions
} from "./types.js";

interface Options<Event extends CalendarEvent, Resource> {
    resize: ResizeState<Event, Resource> | null;
    dispatch: InteractionDispatch<Event, Resource>;
    stageRef: RefObject<HTMLDivElement | null>;
    columns: LayoutColumn<Resource>[];
    totalMinutes: number;
    onEventResize?: ViewProps<Event, Resource>["onEventResize"];
}

export const useTimedResize = <Event extends CalendarEvent, Resource>({
    resize,
    dispatch,
    stageRef,
    columns,
    totalMinutes,
    onEventResize
}: Options<Event, Resource>): TimedResizeInteractions<Event, Resource> => {
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
            resize?.pointerId !== interaction.pointerId
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
        if (resize?.pointerId !== interaction.pointerId) return;

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
        if (resize?.pointerId !== interaction.pointerId) return;

        interaction.stopPropagation();
        cancelResize();
    }, [cancelResize, resize]);

    return {
        resize,
        beginResize,
        updateResize,
        cancelResize,
        commitResize,
        handleResizePointerMove,
        handleResizePointerUp,
        handleResizePointerCancel
    };
};
