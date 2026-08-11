import { format } from "date-fns/format";
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
    locale,
    onClick,
    onDoubleClick,
    onKeyDown,
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
            aria-label={isInteractive ? [
                event.title ?? "Calendar event",
                `${format(event.start, "EEEE, MMMM do, HH:mm", { locale })} to ${format(event.end, "EEEE, MMMM do, HH:mm", { locale })}`,
                event.description
            ].filter(Boolean).join(", ") : undefined}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            aria-keyshortcuts={ariaKeyShortcuts}
            style={style}
        >
            <time className="agenda-view_event-time">
                {format(event.start, "HH:mm", { locale })}–{format(event.end, "HH:mm", { locale })}
            </time>
            <span className="agenda-view_event-content">
                <strong>{event.title}</strong>
                {event.description && <span>{event.description}</span>}
            </span>
        </Component>
    );
}
