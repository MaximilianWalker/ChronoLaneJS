import type {
    ComponentType,
    ReactNode,
    SyntheticEvent
} from "react";

import type {
    CalendarComponents,
    CalendarDateInput,
    CalendarEvent,
    CalendarRange,
    CalendarRangeDefinition,
    CalendarResourceConfig,
    CalendarResourceId,
    CalendarRendererElementProps,
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

export interface TimeGridColumn<Resource = unknown> {
    key: string;
    day: Date;
    dayIndex: number;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
    resourceIndex: number | null;
}

export interface TimeGridSlot<Resource = unknown> {
    key: string;
    start: Date;
    end: Date;
    duration: number;
    timeIndex: number;
    day: Date;
    dayIndex: number;
    columnIndex: number;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
    isDividerBoundary: boolean;
}

export type TimeGridEventSegment<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> = Omit<NormalizedCalendarEvent<Event>, "resource"> & {
    event: NormalizedCalendarEvent<Event>;
    day: Date;
    dayIndex: number;
    columnIndex: number;
    resource: Resource | null;
    columnResourceId: CalendarResourceId | null;
    resourceIndex: number | null;
    startRow: number;
    endRow: number;
};

export type TimeGridEventLayout<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> = TimeGridEventSegment<Event, Resource> & {
    laneIndex: number;
    laneCount: number;
};

/** Calendar position occupied by an event before or after a drop. */
export interface TimeGridEventDropPosition<Resource = unknown> {
    day: Date;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
}

/** Complete application-facing result of dropping a time-grid event. */
export interface TimeGridEventDrop<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    event: NormalizedCalendarEvent<Event>;
    start: Date;
    end: Date;
    source: TimeGridEventDropPosition<Resource>;
    destination: TimeGridEventDropPosition<Resource>;
}

export interface TimeGridDivider {
    key: string;
    time: Date;
    startRow: number;
    rowSpan: number;
}

export interface TimeGridLayout<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    columns: TimeGridColumn<Resource>[];
    slots: TimeGridSlot<Resource>[];
    dividers: TimeGridDivider[];
    events: TimeGridEventLayout<Event, Resource>[];
    backgroundEvents: TimeGridEventSegment<Event, Resource>[];
    totalMinutes: number;
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
    segment: TimeGridEventLayout<Event, Resource>;
    selected: boolean;
    elementProps: CalendarRendererElementProps;
}

export interface TimeGridBackgroundEventProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    event: NormalizedCalendarEvent<Event>;
    segment: TimeGridEventSegment<Event, Resource>;
    elementProps: CalendarRendererElementProps;
}

export interface TimeGridDayHeaderProps<Resource = unknown> {
    day: Date;
    dayIndex: number;
    columns: TimeGridColumn<Resource>[];
    title: string;
}

export interface TimeGridResourceHeaderProps<Resource = unknown> {
    resource: Resource;
    resourceId: CalendarResourceId;
    resourceIndex: number;
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
> extends SharedViewProps<Event> {
    resources?: CalendarResourceConfig<Event, Resource>;
    groupBy?: TimeGridGroupBy;
    range?: CalendarRangeDefinition;
    navigationStep?: number;
    navigateDate?: (
        anchorDate: Date,
        direction: -1 | 1,
        range: CalendarRange
    ) => CalendarDateInput;
    weekStart?: CalendarWeekStart;
    minTime?: TimeOfDay;
    maxTime?: TimeOfDay | "24:00";
    slotDuration?: number;
    labelInterval?: number;
    headerHeight?: number;
    timeLabelWidth?: number;
    cellWidth?: number;
    cellHeight?: number;
    showGridLines?: boolean;
    selectedRange?: { start: Date; end: Date };
    canDragEvent?: (
        event: NormalizedCalendarEvent<Event>,
        segment: TimeGridEventLayout<Event, Resource>
    ) => boolean;
    onEventDrop?: (change: TimeGridEventDrop<Event, Resource>) => void;
    onSlotSelect?: (
        slot: TimeGridSlot<Resource>,
        interaction: SyntheticEvent
    ) => void;
    components?: TimeGridComponents<Event, Resource>;
}
