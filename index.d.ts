import type {
    ComponentType,
    CSSProperties,
    ReactNode,
    SyntheticEvent
} from "react";
import type { Locale } from "date-fns";

export type CalendarDateInput = Date | string | number;
export type CalendarLocale = string | Locale;
export type CalendarEventId = string | number;
export type CalendarRenderer = ComponentType<any>;

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
    style?: CSSProperties;
    titleStyle?: CSSProperties;
    descriptionStyle?: CSSProperties;
    [key: string]: unknown;
}

export interface CalendarRangeContext {
    weekStartsOn: number;
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

export interface CalendarViewDefinition {
    component: ComponentType<any>;
    defaultProps?: Record<string, unknown>;
}

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
    eventEditable?: boolean | ((event: Event) => boolean);
    onDateChange?: (date: Date) => void;
    onRangeChange?: (range: {
        start: Date;
        end: Date;
        days: Date[];
        [key: string]: unknown;
    }) => void;
    onEventClick?: (event: SyntheticEvent, calendarEvent: Event) => void;
    onSelectEvent?: (event: Event, interaction: SyntheticEvent) => void;
    onEventEdit?: (event: Event, interaction: SyntheticEvent) => void;
    eventComponent?: CalendarRenderer;
    navigationButton?: CalendarRenderer;
    previousLabel?: string;
    nextLabel?: string;
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
        range: { days: Date[]; start: Date; end: Date }
    ) => CalendarDateInput;
    weekStart?: number;
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
    formatHeader?: (range: {
        start: Date;
        end: Date;
        days: Date[];
        locale: Locale;
    }) => ReactNode;
    selectedRange?: { start: Date; end: Date };
    eventDraggable?: boolean | ((event: Event) => boolean);
    onEventDrop?: (change: {
        event: Event;
        start: Date;
        end: Date;
        nextEvent: Event & { start: Date; end: Date };
    }) => void;
    onSlotClick?: (event: SyntheticEvent, slot: TimeGridSlot<Resource>) => void;
    onSelectSlot?: (slot: TimeGridSlot<Resource>, event: SyntheticEvent) => void;
    getResourceId?: (resource: Resource) => unknown;
    getResourceTitle?: (resource: Resource) => ReactNode;
    getEventResourceIds?: (event: Event) => unknown[];
    slotComponent?: CalendarRenderer;
    backgroundEventComponent?: CalendarRenderer;
    columnHeaderComponent?: CalendarRenderer;
}

export interface TimeGridSlot<Resource = unknown> {
    start: Date;
    end: Date;
    day: Date;
    dayIndex: number;
    columnIndex: number;
    resource: Resource | null;
}

export interface AgendaViewProps<Event extends CalendarEvent = CalendarEvent>
    extends SharedViewProps<Event> {
    range?: CalendarRangeDefinition;
    navigationStep?: number;
    weekStart?: number;
    dayFormat?: string;
    headerFormat?: string;
    dayHeaderComponent?: CalendarRenderer;
    emptyComponent?: CalendarRenderer;
}

export interface MonthViewProps<Event extends CalendarEvent = CalendarEvent>
    extends SharedViewProps<Event> {
    weekStart?: number;
    showOutsideDays?: boolean;
    maxEventsPerDay?: number;
    headerFormat?: string;
    weekdayFormat?: string;
    selectedDate?: CalendarDateInput;
    onSelectDay?: (day: Date, event: SyntheticEvent) => void;
    onShowMore?: (
        group: { day: Date; events: Event[] },
        event: SyntheticEvent
    ) => void;
    dayHeaderComponent?: CalendarRenderer;
}

export interface CalendarProps<Event extends CalendarEvent = CalendarEvent> {
    className?: string;
    style?: CSSProperties;
    view?: string;
    views?: Record<string, ComponentType<any> | CalendarViewDefinition>;
    viewProps?: Record<string, unknown>;
    events?: Event[];
    backgroundEvents?: Event[];
    weekViewProps?: Partial<TimeGridViewProps<Event>>;
    locale?: CalendarLocale;
    localeFallback?: ReactNode;
    [key: string]: unknown;
}

declare const Calendar: ComponentType<CalendarProps>;

export default Calendar;
export const AgendaView: ComponentType<AgendaViewProps>;
export const DayView: ComponentType<TimeGridViewProps>;
export const MonthView: ComponentType<MonthViewProps>;
export const ResourceView: ComponentType<TimeGridViewProps>;
export const TimeGridView: ComponentType<TimeGridViewProps>;
export const WeekView: ComponentType<TimeGridViewProps>;
export const defaultCalendarViews: Readonly<Record<string, ComponentType<any>>>;

export const DEFAULT_CALENDAR_LOCALE: "en-US";
export const calendarLocaleNames: readonly string[];
export function loadCalendarLocale(locale?: CalendarLocale): Promise<Locale>;
export const preloadCalendarLocale: typeof loadCalendarLocale;
export function resolveCalendarLocaleName(name?: string): string;

export function parseCalendarDate(value: CalendarDateInput): Date;
export function toCalendarTimeZone(value: Date, timeZone?: string): Date;
export function calendarDateFromTimestamp(timestamp: number, timeZone?: string): Date;
export function asCalendarDate(value: CalendarDateInput, timeZone?: string): Date;
export function setDate(time: Date, year?: number, month?: number, day?: number): Date;
export function setTime(
    date: Date,
    hours?: number,
    minutes?: number,
    seconds?: number,
    milliseconds?: number
): Date;

export function createCalendarRange(options: {
    start: Date;
    end?: Date;
    days?: number;
    includeDay?: (day: Date) => boolean;
}): Date[];
export function resolveCalendarRange(
    range: CalendarRangeDefinition | null | undefined,
    anchorDate: Date,
    options?: { weekStartsOn?: number; defaultRange?: "day" | "week" | number }
): Date[];
export function getCalendarRangeBounds(days: Date[]): { start: Date; end: Date };
export function moveCalendarDate(date: Date, direction: -1 | 1, stepDays: number): Date;
