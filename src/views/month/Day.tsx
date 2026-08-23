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
    onSelect?: ViewProps<Event>["onSelectDay"];
    onShowMore?: ViewProps<Event>["onShowMore"];
    eventRenderer: ComponentType<EventProps<Event>>;
    headerRenderer: ComponentType<DayHeaderProps>;
    behavior: EventBehavior<Event, never>;
    text: ViewText;
}

export default function Day<Event extends CalendarEvent>({
    entry,
    onSelect,
    onShowMore,
    eventRenderer,
    headerRenderer: DayHeaderRenderer,
    behavior,
    text
}: DayProps<Event>) {
    const {
        day,
        className,
        outsideMonth,
        showEvents,
        visibleEvents,
        callbackEvents,
        backgroundEvents,
        hiddenEventCount
    } = entry;

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
            {showEvents && (
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
                                events: callbackEvents
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
