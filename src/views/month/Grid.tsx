import type { ComponentType } from "react";

import type {
    EventBehavior,
    ViewText
} from "../../components/eventPresentation.js";
import type { CalendarEvent } from "../../types.js";
import Day from "./Day.js";
import type { DayEntry } from "./layout.js";
import type {
    DayHeaderProps,
    EventProps,
    ViewProps
} from "./types.js";

interface GridProps<Event extends CalendarEvent> {
    weeks: DayEntry<Event>[][];
    weekdayHeaders: Date[];
    anchorDate: Date;
    selectedDate: Date | null;
    showOutsideDays: boolean;
    maxEvents: number;
    onSelectDay?: ViewProps<Event>["onSelectDay"];
    onShowMore?: ViewProps<Event>["onShowMore"];
    eventRenderer: ComponentType<EventProps<Event>>;
    headerRenderer: ComponentType<DayHeaderProps>;
    behavior: EventBehavior<Event, never>;
    text: ViewText;
}

export default function Grid<Event extends CalendarEvent>({
    weeks,
    weekdayHeaders,
    anchorDate,
    selectedDate,
    showOutsideDays,
    maxEvents,
    onSelectDay,
    onShowMore,
    eventRenderer,
    headerRenderer,
    behavior,
    text
}: GridProps<Event>) {
    return (
        <div
            className="month-view_grid-wrapper calendar-scroll-region"
            aria-label={text.messages.monthGridLabel({
                view: text.context.view
            })}
            tabIndex={0}
        >
            <div className="month-view_grid" role="grid">
                <div className="month-view_weekdays" role="row">
                    {weekdayHeaders.map((day) => (
                        <div
                            key={`weekday-${day.getDay()}`}
                            className="month-view_weekday"
                            role="columnheader"
                        >
                            {text.formatters.weekday(day, text.context)}
                        </div>
                    ))}
                </div>
                {weeks.map((week, weekIndex) => (
                    <div
                        key={weekIndex}
                        className="month-view_week"
                        role="row"
                    >
                        {week.map((entry) => (
                            <Day
                                key={entry.day.getTime()}
                                entry={entry}
                                anchorDate={anchorDate}
                                selectedDate={selectedDate}
                                showOutsideDays={showOutsideDays}
                                maxEvents={maxEvents}
                                onSelect={onSelectDay}
                                onShowMore={onShowMore}
                                eventRenderer={eventRenderer}
                                headerRenderer={headerRenderer}
                                behavior={behavior}
                                text={text}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
