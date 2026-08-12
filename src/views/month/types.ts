import type {
    ComponentType,
    KeyboardEventHandler,
    MouseEventHandler,
    SyntheticEvent
} from "react";

import type {
    CalendarDateInput,
    CalendarEvent,
    CalendarRange,
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
    className: string;
    day: Date;
    timeLabel: string;
    selected: boolean;
    "aria-label": string;
    "aria-keyshortcuts"?: string;
    onClick?: MouseEventHandler<HTMLElement>;
    onDoubleClick?: MouseEventHandler<HTMLElement>;
    onKeyDown?: KeyboardEventHandler<HTMLElement>;
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
    eventComponent?: ComponentType<MonthEventProps<Event>>;
    dayHeaderComponent?: ComponentType<MonthDayHeaderProps>;
}
