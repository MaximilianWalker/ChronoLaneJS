import {
    useReducer,
    useRef
} from "react";

import type { CalendarEvent } from "../../../types.js";
import type {
    LayoutColumn,
    LayoutSlot
} from "../layout/types.js";
import type { ViewProps } from "../types.js";
import { reduceInteraction } from "./reducer.js";
import { useMultiDayMove } from "./useMultiDayMove.js";
import { useMultiDayResize } from "./useMultiDayResize.js";
import { useTimedMove } from "./useTimedMove.js";
import { useTimedResize } from "./useTimedResize.js";

interface Options<Event extends CalendarEvent, Resource> {
    columns: LayoutColumn<Resource>[];
    slots: LayoutSlot<Resource>[];
    totalMinutes: number;
    slotDuration: number;
    onEventDrop?: ViewProps<Event, Resource>["onEventDrop"];
    onEventResize?: ViewProps<Event, Resource>["onEventResize"];
}

export const useInteractionController = <
    Event extends CalendarEvent,
    Resource
>({
    columns,
    slots,
    totalMinutes,
    slotDuration,
    onEventDrop,
    onEventResize
}: Options<Event, Resource>) => {
    const [active, dispatch] = useReducer(
        reduceInteraction<Event, Resource>,
        null
    );
    const stageRef = useRef<HTMLDivElement>(null);
    const multiDayRef = useRef<HTMLDivElement>(null);

    const timedMove = useTimedMove({
        move: active?.kind === "move" ? active : null,
        dispatch,
        stageRef,
        columns,
        slots,
        totalMinutes,
        slotDuration,
        onEventDrop
    });
    const timedResize = useTimedResize({
        resize: active?.kind === "resize" ? active : null,
        dispatch,
        stageRef,
        columns,
        totalMinutes,
        onEventResize
    });
    const multiDayMove = useMultiDayMove({
        move: active?.kind === "multi-day-move" ? active : null,
        dispatch,
        gridRef: multiDayRef,
        columns,
        onEventDrop
    });
    const multiDayResize = useMultiDayResize({
        resize: active?.kind === "multi-day-resize" ? active : null,
        dispatch,
        gridRef: multiDayRef,
        columns,
        onEventResize
    });

    return {
        stageRef,
        multiDayRef,
        timed: { ...timedMove, ...timedResize },
        multiDay: { ...multiDayMove, ...multiDayResize }
    };
};
