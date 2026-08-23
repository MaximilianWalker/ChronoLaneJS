import type {
    ComponentType,
    SyntheticEvent
} from "react";

import type {
    CalendarComponents,
    CalendarDateInput,
    CalendarEvent,
    CalendarRendererElementProps,
    CalendarWeekStart,
    NormalizedCalendarEvent,
    SharedViewProps
} from "../../types.js";

export interface DayHeaderProps {
    day: Date;
    label: string;
    outsideMonth: boolean;
}

export interface EventProps<Event extends CalendarEvent = CalendarEvent> {
    event: NormalizedCalendarEvent<Event>;
    day: Date;
    timeLabel: string;
    selected: boolean;
    elementProps: CalendarRendererElementProps;
}

/** Replaceable render boundaries owned by the month view. */
export interface Components<Event extends CalendarEvent = CalendarEvent>
    extends CalendarComponents {
    event?: ComponentType<EventProps<Event>>;
    dayHeader?: ComponentType<DayHeaderProps>;
}

export interface ViewProps<Event extends CalendarEvent = CalendarEvent>
    extends SharedViewProps<Event, never> {
    weekStart?: CalendarWeekStart;
    showOutsideDays?: boolean;
    maxEventsPerDay?: number;
    selectedDate?: CalendarDateInput;
    onSelectDay?: (day: Date, interaction: SyntheticEvent) => void;
    onShowMore?: (
        group: { day: Date; events: NormalizedCalendarEvent<Event>[] },
        interaction: SyntheticEvent
    ) => void;
    components?: Components<Event>;
}
