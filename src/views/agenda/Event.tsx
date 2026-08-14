import type { ElementType } from "react";

import type { CalendarEvent } from "../../types.js";
import type { AgendaEventProps } from "./types.js";

/**
 * Renders the default agenda event with its time, title, and description.
 *
 * The root element becomes a button only when an interaction handler is
 * supplied, preserving non-interactive semantics for read-only agendas.
 */
export default function Event<EventType extends CalendarEvent = CalendarEvent>({
    event,
    timeLabel,
    selected,
    elementProps
}: AgendaEventProps<EventType>) {
    const isInteractive = Boolean(elementProps.onClick || elementProps.onDoubleClick);
    const Component: ElementType = isInteractive ? "button" : "div";

    return (
        <Component
            {...elementProps}
            type={isInteractive ? "button" : undefined}
            className={`${elementProps.className}${selected ? " is-selected" : ""}`}
            data-event-id={event.id}
        >
            <time className="agenda-view_event-time">
                {timeLabel}
            </time>
            <span className="agenda-view_event-content">
                <strong>{event.title}</strong>
                {event.description && <span>{event.description}</span>}
            </span>
        </Component>
    );
}
