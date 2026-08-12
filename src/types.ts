import type {
    ButtonHTMLAttributes,
    ComponentProps,
    ComponentType,
    CSSProperties,
    ElementType,
    HTMLAttributes,
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

/** Prepared attributes and interaction handlers for a renderer's root element. */
export interface CalendarRendererElementProps extends HTMLAttributes<HTMLElement> {
    className: string;
    style?: CalendarStyle;
}

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

/** Context supplied to every calendar date and time formatter. */
export interface CalendarFormatContext {
    locale: Locale;
    view: string;
}

/** Complete registry for rendering calendar-owned dates and times. */
export interface CalendarFormatters {
    time: (date: Date, context: CalendarFormatContext) => string;
    date: (date: Date, context: CalendarFormatContext) => string;
    weekday: (date: Date, context: CalendarFormatContext) => string;
    dayHeader: (date: Date, context: CalendarFormatContext) => string;
    rangeHeader: (
        range: CalendarRange,
        context: CalendarFormatContext
    ) => ReactNode;
}

/** View identity available to every configurable calendar message. */
export interface CalendarMessageContext {
    view: string;
}

/** Values available when formatting a navigation control label. */
export interface CalendarNavigationMessageContext extends CalendarMessageContext {
    range: CalendarRange;
}

/** Prepared values available when formatting a time-slot label. */
export interface CalendarSlotMessageContext extends CalendarMessageContext {
    date: string;
    time: string;
}

/** Prepared values available when formatting an event's accessible label. */
export interface CalendarEventMessageContext extends CalendarMessageContext {
    title?: string;
    description?: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
}

/** Prepared values available when formatting a visible event time range. */
export interface CalendarTimeRangeMessageContext extends CalendarMessageContext {
    startTime: string;
    endTime: string;
}

/** Prepared values available when formatting a month-cell overflow control. */
export interface CalendarMoreEventsMessageContext extends CalendarMessageContext {
    count: number;
    date: string;
}

/** Complete registry for calendar-owned visible and accessible text. */
export interface CalendarMessages {
    previous: (context: CalendarNavigationMessageContext) => string;
    next: (context: CalendarNavigationMessageContext) => string;
    timeGridLabel: (context: CalendarMessageContext) => string;
    monthGridLabel: (context: CalendarMessageContext) => string;
    slotLabel: (context: CalendarSlotMessageContext) => string;
    eventLabel: (context: CalendarEventMessageContext) => string;
    timeRange: (context: CalendarTimeRangeMessageContext) => string;
    agendaEmpty: (context: CalendarNavigationMessageContext) => string;
    moreEvents: (context: CalendarMoreEventsMessageContext) => string;
}

export interface CalendarViewDefinition<Component extends ElementType = ElementType> {
    component: Component;
    defaultProps?: Partial<ComponentProps<Component>>;
}

export interface CalendarNavigationButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
    type: "prev" | "next";
}

export type CalendarNavigationButton = ComponentType<CalendarNavigationButtonProps>;

/** Renderer replacements shared by every built-in calendar view. */
export interface CalendarComponents {
    navigation?: CalendarNavigationButton;
}

export interface SharedViewProps<Event extends CalendarEvent = CalendarEvent> {
    events?: Event[];
    backgroundEvents?: Event[];
    date?: CalendarDateInput;
    defaultDate?: CalendarDateInput;
    locale?: CalendarLocale;
    formatters?: CalendarFormatters;
    messages?: CalendarMessages;
    viewName?: string;
    timeZone?: string;
    minDate?: CalendarDateInput | null;
    maxDate?: CalendarDateInput | null;
    showControls?: boolean;
    selectedEventIds?: CalendarEventId[];
    canEditEvent?: (event: NormalizedCalendarEvent<Event>) => boolean;
    onDateChange?: (date: Date) => void;
    onRangeChange?: (range: CalendarRange) => void;
    onEventSelect?: (
        event: NormalizedCalendarEvent<Event>,
        interaction: SyntheticEvent
    ) => void;
    onEventEdit?: (
        event: NormalizedCalendarEvent<Event>,
        interaction: SyntheticEvent
    ) => void;
}
