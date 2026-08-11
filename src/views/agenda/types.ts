import type {
    ComponentType,
    KeyboardEventHandler,
    MouseEventHandler
} from "react";
import type { Locale } from "date-fns";

import type {
    CalendarDateInput,
    CalendarEvent,
    CalendarRange,
    CalendarRangeDefinition,
    CalendarWeekStart,
    NormalizedCalendarEvent,
    SharedViewProps
} from "../../types.js";

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
    "aria-keyshortcuts"?: string;
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
