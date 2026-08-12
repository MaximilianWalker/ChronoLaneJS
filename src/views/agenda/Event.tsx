import type { ElementType } from "react";

import type { CalendarEvent, CalendarStyle } from "../../types.js";
import type { AgendaEventProps } from "./types.js";

/**
 * Renders the default agenda event with its time, title, and description.
 *
 * The root element becomes a button only when an interaction handler is
 * supplied, preserving non-interactive semantics for read-only agendas.
 */
export default function Event<EventType extends CalendarEvent = CalendarEvent>({
    event,
    className,
    timeLabel,
    onClick,
    onDoubleClick,
    onKeyDown,
    "aria-label": ariaLabel,
    "aria-keyshortcuts": ariaKeyShortcuts,
    selected
}: AgendaEventProps<EventType>) {
    const isInteractive = Boolean(onClick || onDoubleClick);
    const Component: ElementType = isInteractive ? "button" : "div";
    const style: CalendarStyle = { "--color": event.color };

    return (
        <Component
            type={isInteractive ? "button" : undefined}
            className={`${className}${selected ? " is-selected" : ""}`}
            data-event-id={event.id}
            aria-label={isInteractive ? ariaLabel : undefined}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            aria-keyshortcuts={ariaKeyShortcuts}
            style={style}
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
