import type {
    ButtonHTMLAttributes,
    ComponentProps,
    ComponentType,
    CSSProperties,
    ElementType,
    HTMLAttributes,
    KeyboardEvent,
    MouseEvent,
    ReactNode,
    SyntheticEvent
} from "react";
import type { Locale } from "date-fns";

export type CalendarDateInput = Date | string | number;
export type CalendarLocale = string | Locale;
export type CalendarEventId = string | number;
/** Stable non-empty string or finite number used for resource identity. */
export type CalendarResourceId = string | number;
export type CalendarWeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;
/**
 * Pixel length accepted by layout-sensitive calendar theme tokens.
 * Negative values are syntactically representable but invalid for these sizes.
 */
export type CalendarPixelSize = `${number}px`;

/** Stable CSS custom properties exposed by the bundled calendar theme. */
export interface CalendarCSSVariables {
    "--calendar-scrollbar-inset"?: string;
    "--calendar-scrollbar-radius"?: string;
    "--calendar-scrollbar-size"?: string;
    "--calendar-scrollbar-thumb"?: string;
    "--calendar-scrollbar-thumb-hover"?: string;
    "--calendar-scrollbar-track"?: string;
    "--calendar-scrollbar-width"?: "auto" | "none" | "thin";
    "--calendar-time-grid-frame-width"?: CalendarPixelSize;
    "--calendar-time-grid-header-row-height"?: CalendarPixelSize;
    "--calendar-time-grid-line-width"?: CalendarPixelSize;
    "--calendar-time-grid-time-axis-width"?: CalendarPixelSize;
}

/** React styles with typed calendar tokens and application-defined variables. */
export type CalendarStyle = CSSProperties
    & CalendarCSSVariables
    & Partial<Record<`--${string}`, string | number>>;

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
    resourceId?: CalendarResourceId;
    resourceIds?: CalendarResourceId[];
    resource?: unknown;
    style?: CalendarStyle;
    titleStyle?: CSSProperties;
    descriptionStyle?: CSSProperties;
}

export type NormalizedCalendarEvent<Event extends CalendarEvent = CalendarEvent> =
    Omit<Event, "start" | "end"> & { start: Date; end: Date };

/** Concrete day and resource occurrence that received an event interaction. */
export interface CalendarEventOccurrence<Resource = unknown> {
    day: Date;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
}

/** View and occurrence identity supplied with an event interaction. */
export interface CalendarEventInteractionContext<Resource = unknown> {
    view: string;
    occurrence: CalendarEventOccurrence<Resource>;
}

/** Raw event handlers composed with the calendar's semantic interactions. */
export interface CalendarEventInteractions<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    onClick?: (
        event: NormalizedCalendarEvent<Event>,
        interaction: MouseEvent<HTMLElement>,
        context: CalendarEventInteractionContext<Resource>
    ) => void;
    onDoubleClick?: (
        event: NormalizedCalendarEvent<Event>,
        interaction: MouseEvent<HTMLElement>,
        context: CalendarEventInteractionContext<Resource>
    ) => void;
    onContextMenu?: (
        event: NormalizedCalendarEvent<Event>,
        interaction: MouseEvent<HTMLElement>,
        context: CalendarEventInteractionContext<Resource>
    ) => void;
    onKeyDown?: (
        event: NormalizedCalendarEvent<Event>,
        interaction: KeyboardEvent<HTMLElement>,
        context: CalendarEventInteractionContext<Resource>
    ) => void;
    ariaKeyShortcuts?: string | ((
        event: NormalizedCalendarEvent<Event>,
        context: CalendarEventInteractionContext<Resource>
    ) => string | undefined);
}

/** Resource columns and accessors supplied to a time-grid view. */
export interface CalendarResourceConfig<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    /** Concrete resources rendered once per visible day. */
    items: Resource[];
    /** Returns the stable identity used to match resources and events. */
    getId?: (resource: Resource) => CalendarResourceId;
    /** Returns the prepared heading content for a resource column. */
    getTitle?: (resource: Resource) => ReactNode;
    /** Returns every resource ID to which an event is assigned. */
    getEventIds?: (
        event: NormalizedCalendarEvent<Event>
    ) => CalendarResourceId[];
}

export interface CalendarRangeContext {
    /** Locale-derived or explicitly configured first weekday. */
    weekStartsOn: CalendarWeekStart;
}

export interface CalendarRange {
    /** Inclusive first visible day. */
    start: Date;
    /** Inclusive last visible day. */
    end: Date;
    /** Normalized, unique visible days in chronological order. */
    days: Date[];
    [key: string]: unknown;
}

/** Previous/next behavior owned by a configurable range definition. */
export type CalendarRangeNavigation =
    | {
        /** Positive calendar-day movement applied to the current anchor. */
        stepDays: number;
        resolveAnchor?: never;
    }
    | {
        stepDays?: never;
        /** Resolves the next anchor for one previous or next action. */
        resolveAnchor: (
            anchorDate: Date,
            direction: -1 | 1,
            range: CalendarRange,
            context: CalendarRangeContext
        ) => Date;
    };

type CalendarRangeBoundary =
    | Date
    | ((anchorDate: Date, context: CalendarRangeContext) => Date);

/** Visible-day definition paired with optional range-owned navigation. */
export type CalendarRangeOptions = {
    /** Overrides navigation derived from the range's generated span. */
    navigation?: CalendarRangeNavigation;
} & (
    | {
        /** Fixed or anchor-aware explicit visible days. */
        dates:
            | Date[]
            | ((anchorDate: Date, context: CalendarRangeContext) => Date[]);
        start?: never;
        end?: never;
        dayCount?: never;
        includeDay?: never;
    }
    | {
        dates?: never;
        /** Inclusive start, defaulting to the current anchor. */
        start?: CalendarRangeBoundary;
        /** Retains generated days for which the predicate returns true. */
        includeDay?: (day: Date) => boolean;
    } & (
        | {
            /** Inclusive end; mutually exclusive with `dayCount`. */
            end: CalendarRangeBoundary;
            dayCount?: never;
        }
        | {
            end?: never;
            /** Positive generated-day count; mutually exclusive with `end`. */
            dayCount: number;
        }
    )
);

/** Preset, shorthand, configured, or anchor-aware calendar range input. */
export type CalendarRangeDefinition =
    | "day"
    | "week"
    | number
    | Date[]
    | CalendarRangeOptions
    | ((anchorDate: Date, context: CalendarRangeContext) => CalendarRangeDefinition);

export interface ResolvedCalendarRange extends CalendarRange {
    /** Resolves the next anchor using the strategy carried by this range. */
    navigate: (direction: -1 | 1) => Date;
}

/** Controlled half-open selection boundaries normalized by the active view. */
export interface CalendarSelectionRange {
    start: CalendarDateInput;
    end: CalendarDateInput;
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

/** Prepared values used to label an event movement control. */
export interface CalendarEventMoveHandleMessageContext
    extends CalendarMessageContext {
    title?: string;
}

/** Prepared values used to announce an event movement destination. */
export interface CalendarEventMoveTargetMessageContext
    extends CalendarEventMoveHandleMessageContext {
    date: string;
    time: string;
    resource?: string;
}

/** Prepared values used to label an event resize boundary. */
export interface CalendarEventResizeHandleMessageContext
    extends CalendarMessageContext {
    edge: "start" | "end";
    title?: string;
    date: string;
    time: string;
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
    multiDayRegionLabel: (context: CalendarMessageContext) => string;
    monthGridLabel: (context: CalendarMessageContext) => string;
    slotLabel: (context: CalendarSlotMessageContext) => string;
    eventLabel: (context: CalendarEventMessageContext) => string;
    eventMoveHandle: (
        context: CalendarEventMoveHandleMessageContext
    ) => string;
    eventMoveTarget: (
        context: CalendarEventMoveTargetMessageContext
    ) => string;
    eventResizeHandle: (
        context: CalendarEventResizeHandleMessageContext
    ) => string;
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

export interface SharedViewProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    className?: string;
    style?: CalendarStyle;
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
    canSelectEvent?: (
        event: NormalizedCalendarEvent<Event>,
        context: CalendarEventInteractionContext<Resource>
    ) => boolean;
    canOpenEvent?: (
        event: NormalizedCalendarEvent<Event>,
        context: CalendarEventInteractionContext<Resource>
    ) => boolean;
    onDateChange?: (date: Date) => void;
    onRangeChange?: (range: CalendarRange) => void;
    onEventSelect?: (
        event: NormalizedCalendarEvent<Event>,
        interaction: SyntheticEvent,
        context: CalendarEventInteractionContext<Resource>
    ) => void;
    onEventOpen?: (
        event: NormalizedCalendarEvent<Event>,
        interaction: SyntheticEvent,
        context: CalendarEventInteractionContext<Resource>
    ) => void;
    eventInteractions?: CalendarEventInteractions<Event, Resource>;
}
