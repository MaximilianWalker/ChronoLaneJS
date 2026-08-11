import type {
    ButtonHTMLAttributes,
    ComponentType,
    CSSProperties,
    DragEventHandler,
    ElementType,
    KeyboardEventHandler,
    MouseEventHandler,
    ReactNode,
    SyntheticEvent
} from "react";
import type { Locale } from "date-fns";

export type CalendarDateInput = Date | string | number;
export type CalendarLocale = string | Locale;
export type CalendarEventId = string | number;
export type CalendarResourceId = string | number;
export type CalendarWeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type CalendarStyle = CSSProperties & Partial<Record<`--${string}`, string | number>>;

export interface CalendarEvent {
    id?: CalendarEventId;
    title?: string;
    description?: string;
    start: CalendarDateInput;
    end: CalendarDateInput;
    color?: string;
    variant?: string;
    resourceId?: unknown;
    resourceIds?: unknown[];
    resource?: unknown;
    style?: CalendarStyle;
    titleStyle?: CSSProperties;
    descriptionStyle?: CSSProperties;
}

export type NormalizedCalendarEvent<Event extends CalendarEvent = CalendarEvent> =
    Omit<Event, "start" | "end"> & { start: Date; end: Date };

export interface CalendarRangeContext {
    weekStartsOn: CalendarWeekStart;
}

export interface CalendarRangeOptions {
    start?: Date | ((anchorDate: Date, context: CalendarRangeContext) => Date);
    end?: Date | ((anchorDate: Date, context: CalendarRangeContext) => Date);
    days?: number;
    includeDay?: (day: Date) => boolean;
    navigationStep?: number;
}

export type CalendarRangeDefinition =
    | "day"
    | "week"
    | number
    | Date[]
    | CalendarRangeOptions
    | ((anchorDate: Date, context: CalendarRangeContext) => CalendarRangeDefinition);

export interface CalendarRange {
    start: Date;
    end: Date;
    days: Date[];
    [key: string]: unknown;
}

export interface CalendarViewDefinition {
    component: ElementType;
    defaultProps?: Record<string, unknown>;
}

export interface CalendarNavigationButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
    type: "prev" | "next";
}

export type CalendarNavigationButton = ComponentType<CalendarNavigationButtonProps>;

export interface SharedViewProps<Event extends CalendarEvent = CalendarEvent> {
    events?: Event[];
    backgroundEvents?: Event[];
    date?: CalendarDateInput;
    defaultDate?: CalendarDateInput;
    startDate?: CalendarDateInput;
    locale?: CalendarLocale;
    timeZone?: string;
    minDate?: CalendarDateInput | null;
    maxDate?: CalendarDateInput | null;
    showControls?: boolean;
    selectedEventIds?: CalendarEventId[];
    eventEditable?: boolean | ((event: NormalizedCalendarEvent<Event>) => boolean);
    onDateChange?: (date: Date) => void;
    onRangeChange?: (range: CalendarRange) => void;
    onEventClick?: (
        interaction: SyntheticEvent,
        event: NormalizedCalendarEvent<Event>
    ) => void;
    onSelectEvent?: (
        event: NormalizedCalendarEvent<Event>,
        interaction: SyntheticEvent
    ) => void;
    onEventEdit?: (
        event: NormalizedCalendarEvent<Event>,
        interaction: SyntheticEvent
    ) => void;
    navigationButton?: CalendarNavigationButton;
    previousLabel?: string;
    nextLabel?: string;
}

export interface AgendaDayHeaderProps {
    day: Date;
    locale: Locale;
    format: string;
}

export interface AgendaEventProps<Event extends CalendarEvent = CalendarEvent> {
    event: NormalizedCalendarEvent<Event>;
    className: string;
    locale: Locale;
    selected: boolean;
    editShortcut?: string;
    onClick?: MouseEventHandler<HTMLElement>;
    onDoubleClick?: MouseEventHandler<HTMLElement>;
    onKeyDown?: KeyboardEventHandler<HTMLElement>;
}

export interface AgendaViewProps<Event extends CalendarEvent = CalendarEvent>
    extends SharedViewProps<Event> {
    range?: CalendarRangeDefinition;
    navigationStep?: number;
    navigateDate?: (
        anchorDate: Date,
        direction: -1 | 1,
        range: CalendarRange
    ) => CalendarDateInput;
    weekStart?: CalendarWeekStart;
    dayFormat?: string;
    headerFormat?: string;
    eventComponent?: ComponentType<AgendaEventProps<Event>>;
    dayHeaderComponent?: ComponentType<AgendaDayHeaderProps>;
    emptyComponent?: ComponentType;
}

export interface MonthDayHeaderProps {
    day: Date;
    locale: Locale;
    outsideMonth: boolean;
}

export interface MonthEventProps<Event extends CalendarEvent = CalendarEvent>
    extends Omit<AgendaEventProps<Event>, "locale"> {
    day: Date;
    locale: Locale;
}

export interface MonthRange extends CalendarRange {
    monthStart: Date;
    monthEnd: Date;
}

export interface MonthViewProps<Event extends CalendarEvent = CalendarEvent>
    extends SharedViewProps<Event> {
    weekStart?: CalendarWeekStart;
    showOutsideDays?: boolean;
    maxEventsPerDay?: number;
    headerFormat?: string;
    weekdayFormat?: string;
    selectedDate?: CalendarDateInput;
    navigateDate?: (
        anchorDate: Date,
        direction: -1 | 1,
        range: MonthRange
    ) => CalendarDateInput;
    onSelectDay?: (day: Date, interaction: SyntheticEvent) => void;
    onShowMore?: (
        group: { day: Date; events: NormalizedCalendarEvent<Event>[] },
        interaction: SyntheticEvent
    ) => void;
    eventComponent?: ComponentType<MonthEventProps<Event>>;
    dayHeaderComponent?: ComponentType<MonthDayHeaderProps>;
}

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

export interface CalendarProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> extends SharedViewProps<Event> {
    className?: string;
    style?: CSSProperties;
    view?: string;
    views?: Record<string, ElementType | CalendarViewDefinition>;
    viewProps?: Record<string, unknown>;
    weekViewProps?: Partial<TimeGridViewProps<Event, Resource>>;
    localeFallback?: ReactNode;
    resources?: Resource[];
    range?: CalendarRangeDefinition;
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
    weekStart?: CalendarWeekStart;
    selectedRange?: { start: Date; end: Date };
    eventDraggable?: TimeGridViewProps<Event, Resource>["eventDraggable"];
    onEventDrop?: TimeGridViewProps<Event, Resource>["onEventDrop"];
    onSlotClick?: TimeGridViewProps<Event, Resource>["onSlotClick"];
    onSelectSlot?: TimeGridViewProps<Event, Resource>["onSelectSlot"];
    getResourceId?: TimeGridViewProps<Event, Resource>["getResourceId"];
    getResourceTitle?: TimeGridViewProps<Event, Resource>["getResourceTitle"];
    getEventResourceIds?: TimeGridViewProps<Event, Resource>["getEventResourceIds"];
    [key: string]: unknown;
}
