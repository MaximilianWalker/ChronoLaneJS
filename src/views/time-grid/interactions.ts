import type {
    Dispatch,
    PointerEvent
} from "react";

import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../types.js";
import type { LayoutMultiDayEvent } from "./layout/multiDayEvents.js";
import type {
    LayoutColumn,
    LayoutEvent,
    LayoutSlot
} from "./layout/types.js";
import type { ResizeBoundary } from "./resize.js";
import type {
    EventPosition,
    EventResizeEdge
} from "./types.js";
export interface MoveState<
    Event extends CalendarEvent,
    Resource
> {
    kind: "move";
    segment: LayoutEvent<Event, Resource>;
    origin: LayoutSlot<Resource>;
    handleKey: string;
    pointerId?: number;
    target?: LayoutSlot<Resource>;
}

export interface ResizeState<
    Event extends CalendarEvent,
    Resource
> {
    kind: "resize";
    event: NormalizedCalendarEvent<Event>;
    edge: EventResizeEdge;
    source: EventPosition<Resource>;
    boundaries: ResizeBoundary<Resource>[];
    handleKey: string;
    pointerId?: number;
    target?: ResizeBoundary<Resource>;
}

export interface MultiDayMoveState<
    Event extends CalendarEvent,
    Resource
> {
    kind: "multi-day-move";
    segment: LayoutMultiDayEvent<Event, Resource>;
    origin: LayoutColumn<Resource>;
    handleKey: string;
    pointerId?: number;
    grabColumnIndex?: number;
    target?: LayoutColumn<Resource>;
}

export interface MultiDayResizeState<
    Event extends CalendarEvent,
    Resource
> {
    kind: "multi-day-resize";
    segment: LayoutMultiDayEvent<Event, Resource>;
    edge: EventResizeEdge;
    source: EventPosition<Resource>;
    dayOffsets: number[];
    handleKey: string;
    pointerId?: number;
    targetOffset?: number;
}

export type ActiveInteraction<
    Event extends CalendarEvent,
    Resource
> =
    | MoveState<Event, Resource>
    | ResizeState<Event, Resource>
    | MultiDayMoveState<Event, Resource>
    | MultiDayResizeState<Event, Resource>
    | null;

export type InteractionAction<
    Event extends CalendarEvent,
    Resource
> =
    | {
        type: "begin";
        interaction: Exclude<ActiveInteraction<Event, Resource>, null>;
    }
    | {
        type: "update";
        interaction: Exclude<ActiveInteraction<Event, Resource>, null>;
    }
    | {
        type: "finish";
        interaction: Exclude<ActiveInteraction<Event, Resource>, null>;
    };

export const reduceInteraction = <Event extends CalendarEvent, Resource>(
    state: ActiveInteraction<Event, Resource>,
    action: InteractionAction<Event, Resource>
): ActiveInteraction<Event, Resource> => {
    if (action.type === "begin") return action.interaction;
    if (
        state?.kind !== action.interaction.kind
        || state.handleKey !== action.interaction.handleKey
    ) return state;

    return action.type === "update" ? action.interaction : null;
};

export interface TimedInteractions<
    Event extends CalendarEvent,
    Resource
> {
    move: MoveState<Event, Resource> | null;
    resize: ResizeState<Event, Resource> | null;
    beginMove: (
        segment: LayoutEvent<Event, Resource>,
        handleKey: string,
        pointerId?: number
    ) => MoveState<Event, Resource> | null;
    updateMoveTarget: (
        current: MoveState<Event, Resource>,
        target: LayoutSlot<Resource>,
        keepOrigin?: boolean
    ) => void;
    cancelMove: () => void;
    commitMove: (current: MoveState<Event, Resource> | null) => void;
    handleMovePointerMove: (interaction: PointerEvent<HTMLElement>) => void;
    handleMovePointerUp: (interaction: PointerEvent<HTMLElement>) => void;
    handleMovePointerCancel: (interaction: PointerEvent<HTMLElement>) => void;
    beginResize: (
        event: NormalizedCalendarEvent<Event>,
        segment: LayoutEvent<Event, Resource>,
        edge: EventResizeEdge,
        handleKey: string,
        boundaries: ResizeBoundary<Resource>[],
        pointerId?: number
    ) => ResizeState<Event, Resource> | null;
    updateResize: (next: ResizeState<Event, Resource>) => void;
    cancelResize: () => void;
    commitResize: (current: ResizeState<Event, Resource> | null) => void;
    handleResizePointerMove: (interaction: PointerEvent<HTMLElement>) => void;
    handleResizePointerUp: (interaction: PointerEvent<HTMLElement>) => void;
    handleResizePointerCancel: (interaction: PointerEvent<HTMLElement>) => void;
}

export interface MultiDayInteractions<
    Event extends CalendarEvent,
    Resource
> {
    move: MultiDayMoveState<Event, Resource> | null;
    resize: MultiDayResizeState<Event, Resource> | null;
    beginMove: (
        segment: LayoutMultiDayEvent<Event, Resource>,
        handleKey: string,
        pointerId?: number,
        grabColumnIndex?: number
    ) => MultiDayMoveState<Event, Resource> | null;
    updateMoveTarget: (
        current: MultiDayMoveState<Event, Resource>,
        target: LayoutColumn<Resource>
    ) => void;
    cancelMove: () => void;
    commitMove: (current: MultiDayMoveState<Event, Resource> | null) => void;
    handleMovePointerMove: (interaction: PointerEvent<HTMLElement>) => void;
    handleMovePointerUp: (interaction: PointerEvent<HTMLElement>) => void;
    handleMovePointerCancel: (interaction: PointerEvent<HTMLElement>) => void;
    beginResize: (
        segment: LayoutMultiDayEvent<Event, Resource>,
        edge: EventResizeEdge,
        handleKey: string,
        dayOffsets: number[],
        pointerId?: number
    ) => MultiDayResizeState<Event, Resource> | null;
    updateResize: (next: MultiDayResizeState<Event, Resource>) => void;
    cancelResize: () => void;
    commitResize: (current: MultiDayResizeState<Event, Resource> | null) => void;
    handleResizePointerMove: (interaction: PointerEvent<HTMLElement>) => void;
    handleResizePointerUp: (interaction: PointerEvent<HTMLElement>) => void;
    handleResizePointerCancel: (interaction: PointerEvent<HTMLElement>) => void;
}

export type InteractionDispatch<
    Event extends CalendarEvent,
    Resource
> = Dispatch<InteractionAction<Event, Resource>>;
