import { isSameDay } from "date-fns/isSameDay";

import type { CalendarEvent } from "../../types.js";
import type { EventProps } from "./types.js";

/**
 * Renders the default compact event representation used in a month cell.
 *
 * The event time is shown only on the day the event starts. The root becomes a
 * focusable event element when pointer or keyboard behavior is available.
 */
export default function DefaultEvent<
    EventType extends CalendarEvent = CalendarEvent
>({
    event,
    day,
    timeLabel,
    selected,
    elementProps
}: EventProps<EventType>) {
    const isInteractive = elementProps.onClick != null
        || elementProps.onDoubleClick != null
        || elementProps.onContextMenu != null
        || elementProps.onKeyDown != null;
    const startsToday = isSameDay(event.start, day);

    return (
        <div
            {...elementProps}
            className={`${elementProps.className}${selected ? " is-selected" : ""}`}
            data-interactive={isInteractive || undefined}
            data-event-id={event.id}
        >
            {startsToday && (
                <time className="month-view_event-time">
                    {timeLabel}
                </time>
            )}
            <span className="month-view_event-title">{event.title}</span>
        </div>
    );
}
