import type { CalendarEvent } from "../../types.js";
import type { AgendaEventProps } from "./types.js";

/**
 * Renders the default agenda event with its time, title, and description.
 *
 * The root remains an event element while supplied handlers add pointer and
 * keyboard behavior without presenting events as buttons.
 */
export default function Event<EventType extends CalendarEvent = CalendarEvent>({
    event,
    timeLabel,
    selected,
    elementProps
}: AgendaEventProps<EventType>) {
    const isInteractive = Boolean(
        elementProps.onClick
        || elementProps.onDoubleClick
        || elementProps.onContextMenu
        || elementProps.onKeyDown
    );

    return (
        <div
            {...elementProps}
            className={`${elementProps.className}${selected ? " is-selected" : ""}`}
            data-interactive={isInteractive || undefined}
            data-event-id={event.id}
        >
            <time className="agenda-view_event-time">
                {timeLabel}
            </time>
            <span className="agenda-view_event-content">
                <strong>{event.title}</strong>
                {event.description && <span>{event.description}</span>}
            </span>
        </div>
    );
}
