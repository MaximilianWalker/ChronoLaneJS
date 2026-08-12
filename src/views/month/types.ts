import type {
    ComponentType,
    SyntheticEvent
} from "react";

import type {
    CalendarComponents,
    CalendarDateInput,
    CalendarEvent,
    CalendarRange,
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

export interface MonthRange extends CalendarRange {
    monthStart: Date;
    monthEnd: Date;
}

export interface MonthViewProps<Event extends CalendarEvent = CalendarEvent>
    extends SharedViewProps<Event> {
    weekStart?: CalendarWeekStart;
    showOutsideDays?: boolean;
    maxEventsPerDay?: number;
    selectedDate?: CalendarDateInput;
    navigateDate?: (
        anchorDate: Date,
        direction: -1 | 1,
        range: MonthRange
    ) => CalendarDateInput;
    onSelectDay?: (day: Date, interaction: SyntheticEvent) => void;
    onShowMore?: (
        group: { day: Date; events: NormalizedCalendarEvent<Event>[] },
        interaction: SyntheticEvent
    ) => void;
    components?: MonthComponents<Event>;
}
