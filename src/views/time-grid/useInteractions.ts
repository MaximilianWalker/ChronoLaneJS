import {
    useReducer,
    useRef
} from "react";

import type { CalendarEvent } from "../../types.js";
import { reduceInteraction } from "./interactions.js";
import type {
    LayoutColumn,
    LayoutSlot
} from "./layout/types.js";
import type { ViewProps } from "./types.js";
import { useMultiDayInteractions } from "./useMultiDayInteractions.js";
import { useTimedInteractions } from "./useTimedInteractions.js";

interface UseInteractionsOptions<
    Event extends CalendarEvent,
    Resource
> {
    columns: LayoutColumn<Resource>[];
    slots: LayoutSlot<Resource>[];
    totalMinutes: number;
    slotDuration: number;
    onEventDrop?: ViewProps<Event, Resource>["onEventDrop"];
    onEventResize?: ViewProps<Event, Resource>["onEventResize"];
}

export const useInteractions = <Event extends CalendarEvent, Resource>({
    columns,
    slots,
    totalMinutes,
    slotDuration,
    onEventDrop,
    onEventResize
}: UseInteractionsOptions<Event, Resource>) => {
    const [active, dispatch] = useReducer(
        reduceInteraction<Event, Resource>,
        null
    );
    const stageRef = useRef<HTMLDivElement>(null);
    const multiDayRef = useRef<HTMLDivElement>(null);
    const timed = useTimedInteractions({
        move: active?.kind === "move" ? active : null,
        resize: active?.kind === "resize" ? active : null,
        dispatch,
        stageRef,
        columns,
        slots,
        totalMinutes,
        slotDuration,
        onEventDrop,
        onEventResize
    });
    const multiDay = useMultiDayInteractions({
        move: active?.kind === "multi-day-move" ? active : null,
        resize: active?.kind === "multi-day-resize" ? active : null,
        dispatch,
        gridRef: multiDayRef,
        columns,
        onEventDrop,
        onEventResize
    });

    return { stageRef, multiDayRef, timed, multiDay };
};
