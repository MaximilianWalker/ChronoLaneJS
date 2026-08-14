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

export interface MonthDayHeaderProps {
    day: Date;
    label: string;
    outsideMonth: boolean;
}

export interface MonthEventProps<Event extends CalendarEvent = CalendarEvent> {
    event: NormalizedCalendarEvent<Event>;
    day: Date;
    timeLabel: string;
    selected: boolean;
    elementProps: CalendarRendererElementProps;
}

/** Replaceable render boundaries owned by the month view. */
export interface MonthComponents<Event extends CalendarEvent = CalendarEvent>
    extends CalendarComponents {
    event?: ComponentType<MonthEventProps<Event>>;
    dayHeader?: ComponentType<MonthDayHeaderProps>;
}

export interface MonthViewProps<Event extends CalendarEvent = CalendarEvent>
    extends SharedViewProps<Event> {
    weekStart?: CalendarWeekStart;
    showOutsideDays?: boolean;
    maxEventsPerDay?: number;
    selectedDate?: CalendarDateInput;
    onSelectDay?: (day: Date, interaction: SyntheticEvent) => void;
    onShowMore?: (
        group: { day: Date; events: NormalizedCalendarEvent<Event>[] },
        interaction: SyntheticEvent
    ) => void;
    components?: MonthComponents<Event>;
}
