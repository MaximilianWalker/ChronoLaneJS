import type {
    ButtonHTMLAttributes,
    ComponentType,
    CSSProperties,
    ElementType,
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
    onEventSelect?: (
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
