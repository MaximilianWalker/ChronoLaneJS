import type {
    ComponentType,
    KeyboardEventHandler,
    MouseEventHandler
} from "react";

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
    label: string;
}

export interface AgendaEventProps<Event extends CalendarEvent = CalendarEvent> {
    event: NormalizedCalendarEvent<Event>;
    className: string;
    timeLabel: string;
    selected: boolean;
    "aria-label": string;
    "aria-keyshortcuts"?: string;
    onClick?: MouseEventHandler<HTMLElement>;
    onDoubleClick?: MouseEventHandler<HTMLElement>;
    onKeyDown?: KeyboardEventHandler<HTMLElement>;
}

export interface AgendaEmptyProps {
    message: string;
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
    eventComponent?: ComponentType<AgendaEventProps<Event>>;
    dayHeaderComponent?: ComponentType<AgendaDayHeaderProps>;
    emptyComponent?: ComponentType<AgendaEmptyProps>;
}
