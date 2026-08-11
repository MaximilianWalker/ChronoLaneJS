import type {
    ComponentType,
    KeyboardEventHandler,
    MouseEventHandler,
    SyntheticEvent
} from "react";
import type { Locale } from "date-fns";

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
    locale: Locale;
    outsideMonth: boolean;
}

export interface MonthEventProps<Event extends CalendarEvent = CalendarEvent> {
    event: NormalizedCalendarEvent<Event>;
    className: string;
    day: Date;
    locale: Locale;
    selected: boolean;
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
    headerFormat?: string;
    weekdayFormat?: string;
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
