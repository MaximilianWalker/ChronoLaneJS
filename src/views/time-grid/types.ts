import type {
    ComponentType,
    CSSProperties,
    DragEventHandler,
    KeyboardEventHandler,
    MouseEventHandler,
    ReactNode,
    SyntheticEvent
} from "react";
import type { Locale } from "date-fns";

import type {
    CalendarDateInput,
    CalendarEvent,
    CalendarStyle,
    CalendarRange,
    CalendarRangeDefinition,
    CalendarWeekStart,
    NormalizedCalendarEvent,
    SharedViewProps
} from "../../types.js";

export interface TimeGridColumn<Resource = unknown> {
    key: string;
    day: Date;
    dayIndex: number;
    resource: Resource | null;
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
    dividerInterval: number;
}

export interface TimeGridSlotProps<Resource = unknown> {
    className: string;
    timeIndex: number;
    dayIndex: number;
    columnIndex: number;
    step: number;
    day: Date;
    resource: Resource | null;
    startTime: Date;
    endTime: Date;
    "aria-label": string;
    onClick?: MouseEventHandler<HTMLElement>;
    onDragOver?: DragEventHandler<HTMLElement>;
    onDrop?: DragEventHandler<HTMLElement>;
    style: CalendarStyle;
}

export interface TimeGridEventProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    className: string;
    event: NormalizedCalendarEvent<Event>;
    segment: TimeGridEventLayout<Event, Resource>;
    dayIndex: number;
    columnIndex: number;
    laneIndex: number;
    laneCount: number;
    resource: Resource | null;
    resourceId?: unknown;
    draggable: boolean;
    onClick?: MouseEventHandler<HTMLElement>;
    onDoubleClick?: MouseEventHandler<HTMLElement>;
    onKeyDown?: KeyboardEventHandler<HTMLElement>;
    onDragStart?: DragEventHandler<HTMLElement>;
    onDragEnd?: DragEventHandler<HTMLElement>;
    "aria-label": string;
    "aria-keyshortcuts"?: string;
    style: CalendarStyle;
    titleStyle?: CSSProperties;
    descriptionStyle?: CSSProperties;
}

export interface TimeGridBackgroundEventProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    className: string;
    event: NormalizedCalendarEvent<Event>;
    segment: TimeGridEventSegment<Event, Resource>;
    dayIndex: number;
    columnIndex: number;
    resource: Resource | null;
    style: CalendarStyle;
}

export interface TimeGridColumnHeaderProps<Resource = unknown> {
    column: TimeGridColumn<Resource>;
    columnIndex: number;
    day: Date;
    dayIndex: number;
    resource: Resource | null;
    resourceIndex: number | null;
    resourceTitle: ReactNode;
    locale: Locale;
    dayFormat: string;
}

export interface TimeGridViewProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> extends SharedViewProps<Event> {
    resources?: Resource[];
    range?: CalendarRangeDefinition;
    navigationStep?: number;
    navigateDate?: (
        anchorDate: Date,
        direction: -1 | 1,
        range: CalendarRange
    ) => CalendarDateInput;
    weekStart?: CalendarWeekStart;
    minTime?: CalendarDateInput;
    maxTime?: CalendarDateInput;
    step?: number;
    dividerInterval?: number;
    headerHeight?: number;
    timeLabelWidth?: number;
    cellWidth?: number;
    cellHeight?: number;
    /** Controls divider visibility without disabling slot interactions. */
    showGridLines?: boolean;
    dayFormat?: string;
    headerFormat?: string;
    formatHeader?: (range: CalendarRange & { locale: Locale }) => ReactNode;
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
    getResourceId?: (resource: Resource) => unknown;
    getResourceTitle?: (resource: Resource) => ReactNode;
    getEventResourceIds?: (event: NormalizedCalendarEvent<Event>) => unknown[];
    slotComponent?: ComponentType<TimeGridSlotProps<Resource>>;
    eventComponent?: ComponentType<TimeGridEventProps<Event, Resource>>;
    backgroundEventComponent?: ComponentType<TimeGridBackgroundEventProps<Event, Resource>>;
    columnHeaderComponent?: ComponentType<TimeGridColumnHeaderProps<Resource>>;
}
