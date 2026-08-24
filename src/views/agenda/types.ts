import type { ComponentType } from "react";

import type {
    CalendarComponents,
    CalendarEvent,
    CalendarRangeDefinition,
    CalendarRendererElementProps,
    CalendarWeekStart,
    NormalizedCalendarEvent,
    SharedViewProps
} from "../../types.js";

export interface DayHeaderProps {
    day: Date;
    label: string;
}

export interface EventProps<Event extends CalendarEvent = CalendarEvent> {
    event: NormalizedCalendarEvent<Event>;
    timeLabel: string;
    selected: boolean;
    elementProps: CalendarRendererElementProps;
}

export interface EmptyProps {
    message: string;
}

/** Replaceable render boundaries owned by the agenda view. */
export interface Components<Event extends CalendarEvent = CalendarEvent>
    extends CalendarComponents {
    event?: ComponentType<EventProps<Event>>;
    dayHeader?: ComponentType<DayHeaderProps>;
    empty?: ComponentType<EmptyProps>;
}

export interface ViewProps<Event extends CalendarEvent = CalendarEvent>
    extends SharedViewProps<Event, never> {
    range?: CalendarRangeDefinition;
    weekStart?: CalendarWeekStart;
    components?: Components<Event>;
}
