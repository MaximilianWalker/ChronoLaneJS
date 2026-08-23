import { useCallback } from "react";
import type {
    PointerEvent,
    RefObject
} from "react";

import type { CalendarEvent } from "../../../types.js";
import {
    createMultiDayEventResize,
    getMultiDayPointerColumnIndex,
    getMultiDayResizeOffset
} from "../layout/multiDayEvents.js";
import type { LayoutMultiDayEvent } from "../layout/multiDayEvents.js";
import type { LayoutColumn } from "../layout/types.js";
import type {
    EventResizeEdge,
    ViewProps
} from "../types.js";
import type {
    InteractionDispatch,
    MultiDayResizeInteractions,
    MultiDayResizeState
} from "./types.js";

interface Options<Event extends CalendarEvent, Resource> {
    resize: MultiDayResizeState<Event, Resource> | null;
    dispatch: InteractionDispatch<Event, Resource>;
    gridRef: RefObject<HTMLDivElement | null>;
    columns: LayoutColumn<Resource>[];
    onEventResize?: ViewProps<Event, Resource>["onEventResize"];
}

export const useMultiDayResize = <Event extends CalendarEvent, Resource>({
    resize,
    dispatch,
    gridRef,
    columns,
    onEventResize
}: Options<Event, Resource>): MultiDayResizeInteractions<Event, Resource> => {
    const beginResize = useCallback((
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

    const updateResize = useCallback((next: MultiDayResizeState<Event, Resource>) => {
        dispatch({ type: "update", interaction: next });
    }, [dispatch]);

    const cancelResize = useCallback(() => {
        if (resize) dispatch({ type: "finish", interaction: resize });
    }, [dispatch, resize]);

    const commitResize = useCallback((
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

    const handleResizePointerMove = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const grid = gridRef.current;
        if (
            resize?.pointerId !== interaction.pointerId
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
            && column.resourceId === resize.source.resourceId
        ));
        if (!targetColumn) return;
        const targetOffset = getMultiDayResizeOffset(
            resize.segment.event,
            resize.edge,
            targetColumn.day
        );
        if (
            !resize.dayOffsets.includes(targetOffset)
            || resize.targetOffset === targetOffset
        ) return;

        updateResize({
            ...resize,
            targetOffset: targetOffset === 0 ? undefined : targetOffset
        });
    }, [columns, gridRef, resize, updateResize]);

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
