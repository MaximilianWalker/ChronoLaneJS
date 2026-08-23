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
export type GroupBy = "day" | "resource";

/** Placement policy for events that cross a local calendar-day boundary. */
export type MultiDayEventLayout = "timed" | "dedicated";

/**
 * Mutually exclusive fixed or minimum dimensions for each time-grid slot axis.
 *
 * @remarks
 * Omitting both width properties makes columns fully fluid in `TimeGridView`
 * and `DayView`; `WeekView` supplies a 96px minimum. Omitting both height
 * properties uses a fixed 50px slot height. Set `minHeight` to `0` for fully
 * fluid rows.
 */
export type SlotSizing = (
    | {
        /** Fixed positive pixel width of each day or resource slot. */
        width?: number;
        minWidth?: never;
    }
    | {
        width?: never;
        /** Non-negative pixel minimum for fluid day or resource slots. */
        minWidth?: number;
    }
) & (
    | {
        /** Fixed positive pixel height of each `slotDuration` interval. */
        height?: number;
        minHeight?: never;
    }
    | {
        height?: never;
        /** Non-negative pixel minimum for fluid `slotDuration` intervals. */
        minHeight?: number;
    }
);

/** Semantic day and resource identity exposed to time-grid header renderers. */
export interface Column<Resource = unknown> {
    day: Date;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
}

/** Application-facing time interval represented by one selectable grid slot. */
export interface Slot<Resource = unknown> {
    start: Date;
    end: Date;
    duration: number;
    day: Date;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
}

/** Semantic event portion rendered by the timed grid or dedicated region. */
export interface EventSegment<Resource = unknown> {
    layout: MultiDayEventLayout;
    start: Date;
    end: Date;
    day: Date;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
}

/** Calendar position occupied by an event interaction in the time grid. */
export interface EventPosition<Resource = unknown> {
    day: Date;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
}

/** Complete application-facing result of moving a time-grid event. */
export interface EventDrop<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    event: NormalizedCalendarEvent<Event>;
    start: Date;
    end: Date;
    source: EventPosition<Resource>;
    destination: EventPosition<Resource>;
}

/** Event boundary changed by a time-grid resize interaction. */
export type EventResizeEdge = "start" | "end";

/** Complete application-facing result of resizing a time-grid event. */
export interface EventResize<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    event: NormalizedCalendarEvent<Event>;
    edge: EventResizeEdge;
    start: Date;
    end: Date;
    source: EventPosition<Resource>;
}

export interface SlotProps<Resource = unknown> {
    slot: Slot<Resource>;
    selected: boolean;
    elementProps: CalendarRendererElementProps;
}

export interface EventProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    event: NormalizedCalendarEvent<Event>;
    segment: EventSegment<Resource>;
    selected: boolean;
    elementProps: CalendarRendererElementProps;
}

export interface BackgroundEventProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    event: NormalizedCalendarEvent<Event>;
    segment: EventSegment<Resource>;
    elementProps: CalendarRendererElementProps;
}

export interface DayHeaderProps<Resource = unknown> {
    day: Date;
    columns: Column<Resource>[];
    title: string;
}

export interface ResourceHeaderProps<Resource = unknown> {
    resource: Resource;
    resourceId: CalendarResourceId;
    columns: Column<Resource>[];
    title: ReactNode;
}

/** Replaceable render boundaries owned by time-grid views and presets. */
export interface Components<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> extends CalendarComponents {
    event?: ComponentType<EventProps<Event, Resource>>;
    slot?: ComponentType<SlotProps<Resource>>;
    backgroundEvent?: ComponentType<BackgroundEventProps<Event, Resource>>;
    dayHeader?: ComponentType<DayHeaderProps<Resource>>;
    resourceHeader?: ComponentType<ResourceHeaderProps<Resource>>;
}

export interface ViewProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> extends SharedViewProps<Event, Resource> {
    resources?: CalendarResourceConfig<Event, Resource>;
    groupBy?: GroupBy;
    /** Places multi-day foreground events in timed slots or a dedicated region. */
    multiDayEventLayout?: MultiDayEventLayout;
    range?: CalendarRangeDefinition;
    weekStart?: CalendarWeekStart;
    minTime?: TimeOfDay;
    maxTime?: TimeOfDay | "24:00";
    slotDuration?: number;
    /** Positive whole-minute increment used by pointer and keyboard resizing. */
    resizeStep?: number;
    labelInterval?: number;
    /** Per-slot fixed or fluid-minimum dimensions. */
    slotSizing?: SlotSizing;
    selectedRange?: CalendarSelectionRange;
    /** Restricts movement controls for individual visible event segments. */
    canDragEvent?: (
        event: NormalizedCalendarEvent<Event>,
        segment: EventSegment<Resource>
    ) => boolean;
    /** Reports one complete movement proposal when the user commits it. */
    onEventDrop?: (change: EventDrop<Event, Resource>) => void;
    canResizeEvent?: (
        event: NormalizedCalendarEvent<Event>,
        segment: EventSegment<Resource>,
        edge: EventResizeEdge
    ) => boolean;
    onEventResize?: (change: EventResize<Event, Resource>) => void;
    onSlotSelect?: (
        slot: Slot<Resource>,
        interaction: SyntheticEvent
    ) => void;
    components?: Components<Event, Resource>;
}
