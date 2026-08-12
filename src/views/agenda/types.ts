import type { ComponentType } from "react";

import type {
    CalendarComponents,
    CalendarDateInput,
    CalendarEvent,
    CalendarRange,
    CalendarRangeDefinition,
    CalendarRendererElementProps,
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
    timeLabel: string;
    selected: boolean;
    elementProps: CalendarRendererElementProps;
}

export interface AgendaEmptyProps {
    message: string;
}

/** Replaceable render boundaries owned by the agenda view. */
export interface AgendaComponents<Event extends CalendarEvent = CalendarEvent>
    extends CalendarComponents {
    event?: ComponentType<AgendaEventProps<Event>>;
    dayHeader?: ComponentType<AgendaDayHeaderProps>;
    empty?: ComponentType<AgendaEmptyProps>;
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
    components?: AgendaComponents<Event>;
}
