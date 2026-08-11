import { format, isSameDay } from "date-fns";

export default function MonthEvent({
    event,
    day,
    locale,
    className,
    selected,
    onClick,
    onDoubleClick,
    onKeyDown,
    editShortcut
}) {
    const Component = onClick || onDoubleClick ? "button" : "div";
    const startsToday = isSameDay(event.start, day);

    return (
        <Component
            type={Component === "button" ? "button" : undefined}
            className={`${className}${selected ? " is-selected" : ""}`}
            data-event-id={event.id}
            aria-label={Component === "button" ? [
                event.title ?? "Calendar event",
                `${format(event.start, "EEEE, MMMM do, HH:mm", { locale })} to ${format(event.end, "EEEE, MMMM do, HH:mm", { locale })}`
            ].join(", ") : undefined}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            aria-keyshortcuts={editShortcut}
            style={{ "--color": event.color }}
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
