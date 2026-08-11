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
    originalStart: Date;
    originalEnd: Date;
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
    event: TimeGridEventLayout<Event, Resource>;
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
    event: TimeGridEventSegment<Event, Resource>;
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
    showGrid?: boolean;
    showGridLines?: boolean;
    dayFormat?: string;
    headerFormat?: string;
    formatHeader?: (range: CalendarRange & { locale: Locale }) => ReactNode;
    selectedRange?: { start: Date; end: Date };
    eventDraggable?: boolean | ((event: TimeGridEventLayout<Event, Resource>) => boolean);
    onEventDrop?: (change: {
        event: TimeGridEventLayout<Event, Resource>;
        start: Date;
        end: Date;
        nextEvent: TimeGridEventLayout<Event, Resource>;
    }) => void;
    onSlotClick?: (
        interaction: SyntheticEvent,
        slot: TimeGridSlot<Resource>
    ) => void;
    onSelectSlot?: (
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
