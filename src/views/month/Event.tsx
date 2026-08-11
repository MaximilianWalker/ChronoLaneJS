import { format } from "date-fns/format";
import { isSameDay } from "date-fns/isSameDay";
import type { ElementType } from "react";

import type {
    CalendarEvent,
    CalendarStyle
} from "../../types.js";
import type { MonthEventProps } from "./types.js";

export default function Event<EventType extends CalendarEvent = CalendarEvent>({
    event,
    day,
    locale,
    className,
    selected,
    onClick,
    onDoubleClick,
    onKeyDown,
    editShortcut
}: MonthEventProps<EventType>) {
    const isInteractive = Boolean(onClick || onDoubleClick);
    const Component: ElementType = isInteractive ? "button" : "div";
    const startsToday = isSameDay(event.start, day);
    const style: CalendarStyle = { "--color": event.color };

    return (
        <Component
            type={isInteractive ? "button" : undefined}
            className={`${className}${selected ? " is-selected" : ""}`}
            data-event-id={event.id}
            aria-label={isInteractive ? [
                event.title ?? "Calendar event",
                `${format(event.start, "EEEE, MMMM do, HH:mm", { locale })} to ${format(event.end, "EEEE, MMMM do, HH:mm", { locale })}`
            ].join(", ") : undefined}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            aria-keyshortcuts={editShortcut}
            style={style}
        >
            {startsToday && (
                <time className="month-view_event-time">
                    {format(event.start, "HH:mm", { locale })}
                </time>
            )}
            <span className="month-view_event-title">{event.title}</span>
        </Component>
    );
}
