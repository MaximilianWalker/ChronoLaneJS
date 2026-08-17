import type {
    ComponentType,
    ReactNode,
    SyntheticEvent
} from "react";

import type {
    CalendarComponents,
    CalendarEvent,
    CalendarRangeDefinition,
    CalendarResourceConfig,
    CalendarResourceId,
    CalendarRendererElementProps,
    CalendarSelectionRange,
    CalendarWeekStart,
    NormalizedCalendarEvent,
    SharedViewProps
} from "../../types.js";

type DecimalDigit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type TimeHour = `0${DecimalDigit}` | `1${DecimalDigit}` | `2${"0" | "1" | "2" | "3"}`;
type TimeMinute = `${"0" | "1" | "2" | "3" | "4" | "5"}${DecimalDigit}`;

/** A zero-padded 24-hour wall-clock time with minute precision. */
export type TimeOfDay = `${TimeHour}:${TimeMinute}`;

/** Outer grouping dimension used when both days and resources are visible. */
export type TimeGridGroupBy = "day" | "resource";

type TimeGridSlotWidth =
    | {
        /** Fixed positive pixel width of each day or resource slot. */
        width?: number;
        minWidth?: never;
    }
    | {
        width?: never;
        /** Non-negative pixel minimum for fluid day or resource slots. */
        minWidth?: number;
    };

type TimeGridSlotHeight =
    | {
        /** Fixed positive pixel height of each `slotDuration` interval. */
        height?: number;
        minHeight?: never;
    }
    | {
        height?: never;
        /** Non-negative pixel minimum for fluid `slotDuration` intervals. */
        minHeight?: number;
    };

/**
 * Mutually exclusive fixed or minimum dimensions for each time-grid slot axis.
 *
 * @remarks
 * Omitting both width properties makes columns fully fluid. Omitting both
 * height properties uses a fixed 50px slot height. Set `minHeight` to `0` for
 * fully fluid rows.
 */
export type TimeGridSlotSizing = TimeGridSlotWidth & TimeGridSlotHeight;

/** Semantic day and resource identity exposed to time-grid header renderers. */
export interface TimeGridColumn<Resource = unknown> {
    day: Date;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
}

/** Application-facing time interval represented by one selectable grid slot. */
export interface TimeGridSlot<Resource = unknown> {
    start: Date;
    end: Date;
    duration: number;
    day: Date;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
}

/** Visible, clipped portion of an event in one day and resource column. */
export interface TimeGridEventSegment<Resource = unknown> {
    start: Date;
    end: Date;
    day: Date;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
}

/** Calendar position occupied by an event interaction in the time grid. */
export interface TimeGridEventPosition<Resource = unknown> {
    day: Date;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
}

/** Complete application-facing result of moving a time-grid event. */
export interface TimeGridEventDrop<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    event: NormalizedCalendarEvent<Event>;
    start: Date;
    end: Date;
    source: TimeGridEventPosition<Resource>;
    destination: TimeGridEventPosition<Resource>;
}

/** Event boundary changed by a time-grid resize interaction. */
export type TimeGridEventResizeEdge = "start" | "end";

/** Complete application-facing result of resizing a time-grid event. */
export interface TimeGridEventResize<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    event: NormalizedCalendarEvent<Event>;
    edge: TimeGridEventResizeEdge;
    start: Date;
    end: Date;
    source: TimeGridEventPosition<Resource>;
}

export interface TimeGridSlotProps<Resource = unknown> {
    slot: TimeGridSlot<Resource>;
    selected: boolean;
    elementProps: CalendarRendererElementProps;
}

export interface TimeGridEventProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    event: NormalizedCalendarEvent<Event>;
    segment: TimeGridEventSegment<Resource>;
    selected: boolean;
    elementProps: CalendarRendererElementProps;
}

export interface TimeGridBackgroundEventProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    event: NormalizedCalendarEvent<Event>;
    segment: TimeGridEventSegment<Resource>;
    elementProps: CalendarRendererElementProps;
}

export interface TimeGridDayHeaderProps<Resource = unknown> {
    day: Date;
    columns: TimeGridColumn<Resource>[];
    title: string;
}

export interface TimeGridResourceHeaderProps<Resource = unknown> {
    resource: Resource;
    resourceId: CalendarResourceId;
    columns: TimeGridColumn<Resource>[];
    title: ReactNode;
}

/** Replaceable render boundaries owned by time-grid views and presets. */
export interface TimeGridComponents<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> extends CalendarComponents {
    event?: ComponentType<TimeGridEventProps<Event, Resource>>;
    slot?: ComponentType<TimeGridSlotProps<Resource>>;
    backgroundEvent?: ComponentType<TimeGridBackgroundEventProps<Event, Resource>>;
    dayHeader?: ComponentType<TimeGridDayHeaderProps<Resource>>;
    resourceHeader?: ComponentType<TimeGridResourceHeaderProps<Resource>>;
}

export interface TimeGridViewProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> extends SharedViewProps<Event, Resource> {
    resources?: CalendarResourceConfig<Event, Resource>;
    groupBy?: TimeGridGroupBy;
    range?: CalendarRangeDefinition;
    weekStart?: CalendarWeekStart;
    minTime?: TimeOfDay;
    maxTime?: TimeOfDay | "24:00";
    slotDuration?: number;
    /** Positive whole-minute increment used by pointer and keyboard resizing. */
    resizeStep?: number;
    labelInterval?: number;
    /** Per-slot fixed or fluid-minimum dimensions. */
    slotSizing?: TimeGridSlotSizing;
    selectedRange?: CalendarSelectionRange;
    /** Restricts movement controls for individual visible event segments. */
    canDragEvent?: (
        event: NormalizedCalendarEvent<Event>,
        segment: TimeGridEventSegment<Resource>
    ) => boolean;
    /** Reports one complete movement proposal when the user commits it. */
    onEventDrop?: (change: TimeGridEventDrop<Event, Resource>) => void;
    canResizeEvent?: (
        event: NormalizedCalendarEvent<Event>,
        segment: TimeGridEventSegment<Resource>,
        edge: TimeGridEventResizeEdge
    ) => boolean;
    onEventResize?: (change: TimeGridEventResize<Event, Resource>) => void;
    onSlotSelect?: (
        slot: TimeGridSlot<Resource>,
        interaction: SyntheticEvent
    ) => void;
    components?: TimeGridComponents<Event, Resource>;
}
