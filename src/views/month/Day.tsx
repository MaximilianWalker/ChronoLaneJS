import { isSameDay } from "date-fns/isSameDay";
import { isSameMonth } from "date-fns/isSameMonth";
import type { ComponentType } from "react";

import type {
    EventBehavior,
    ViewText
} from "../../components/eventPresentation.js";
import type {
    CalendarEvent,
    CalendarStyle
} from "../../types.js";
import type { DayEntry } from "./layout.js";
import Occurrence from "./Occurrence.js";
import type {
    DayHeaderProps,
    EventProps,
    ViewProps
} from "./types.js";

interface DayProps<Event extends CalendarEvent> {
    entry: DayEntry<Event>;
    anchorDate: Date;
    selectedDate: Date | null;
    showOutsideDays: boolean;
    maxEvents: number;
    onSelect?: ViewProps<Event>["onSelectDay"];
    onShowMore?: ViewProps<Event>["onShowMore"];
    eventRenderer: ComponentType<EventProps<Event>>;
    headerRenderer: ComponentType<DayHeaderProps>;
    behavior: EventBehavior<Event, never>;
    text: ViewText;
}

export default function Day<Event extends CalendarEvent>({
    entry,
    anchorDate,
    selectedDate,
    showOutsideDays,
    maxEvents,
    onSelect,
    onShowMore,
    eventRenderer,
    headerRenderer: DayHeaderRenderer,
    behavior,
    text
}: DayProps<Event>) {
    const { day, events, backgroundEvents } = entry;
    const outsideMonth = !isSameMonth(day, anchorDate);
    const overflowEnabled = onShowMore != null && events.length > maxEvents;
    const visibleEvents = overflowEnabled
        ? events.slice(0, maxEvents)
        : events;
    const hiddenEventCount = overflowEnabled ? events.length - maxEvents : 0;
    const dayEvents = events.map((item) => item.event);
    const selected = selectedDate != null && isSameDay(day, selectedDate);
    const className = [
        "month-view_day",
        outsideMonth ? "is-outside" : "",
        selected ? "is-selected" : ""
    ].filter(Boolean).join(" ");

    return (
        <div
            className={className}
            role="gridcell"
            aria-label={text.formatters.date(day, text.context)}
        >
            {backgroundEvents.map(({ key, event }) => (
                <div
                    key={key}
                    className="month-view_background-event"
                    style={{ "--color": event.color } as CalendarStyle}
                />
            ))}
            <button
                type="button"
                className="month-view_day-button"
                disabled={!onSelect}
                onClick={onSelect
                    ? (interaction) => onSelect(day, interaction)
                    : undefined}
            >
                <DayHeaderRenderer
                    day={day}
                    label={text.formatters.dayHeader(day, text.context)}
                    outsideMonth={outsideMonth}
                />
            </button>
            {(!outsideMonth || showOutsideDays) && (
                <div className="month-view_events">
                    {visibleEvents.map(({ key, event }) => (
                        <Occurrence
                            key={key}
                            event={event}
                            day={day}
                            renderer={eventRenderer}
                            behavior={behavior}
                            text={text}
                        />
                    ))}
                    {hiddenEventCount > 0 && (
                        <button
                            type="button"
                            className="month-view_more"
                            onClick={(interaction) => onShowMore?.({
                                day,
                                events: dayEvents
                            }, interaction)}
                        >
                            {text.messages.moreEvents({
                                view: text.context.view,
                                count: hiddenEventCount,
                                date: text.formatters.date(day, text.context)
                            })}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
