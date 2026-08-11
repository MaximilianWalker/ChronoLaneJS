import { format } from "date-fns";

export default function AgendaEvent({
    event,
    className,
    locale,
    onClick,
    onDoubleClick,
    onKeyDown,
    editShortcut,
    selected
}) {
    const Component = onClick || onDoubleClick ? "button" : "div";

    return (
        <Component
            type={Component === "button" ? "button" : undefined}
            className={`${className}${selected ? " is-selected" : ""}`}
            data-event-id={event.id}
            aria-label={Component === "button" ? [
                event.title ?? "Calendar event",
                `${format(event.start, "EEEE, MMMM do, HH:mm", { locale })} to ${format(event.end, "EEEE, MMMM do, HH:mm", { locale })}`,
                event.description
            ].filter(Boolean).join(", ") : undefined}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            aria-keyshortcuts={editShortcut}
            style={{ "--color": event.color }}
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
