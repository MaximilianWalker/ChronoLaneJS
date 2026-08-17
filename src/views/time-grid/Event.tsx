import type { TimeGridEventProps } from "./types.js";

/**
 * Renders the default positioned time-grid event.
 *
 * Layout styles and interactions are supplied by the grid while the root
 * remains an event element and retains native drag support when enabled.
 */
export default function Event({
    event,
    segment,
    selected,
    elementProps
}: TimeGridEventProps) {
    const isInteractive = Boolean(
        elementProps.onClick
        || elementProps.onDoubleClick
        || elementProps.onContextMenu
        || elementProps.onKeyDown
    );

    return (
        <div
            {...elementProps}
            className={`${elementProps.className}${selected ? " is-selected" : ""} ${event.variant ?? "default"}`}
            data-interactive={isInteractive || undefined}
            data-event-id={event.id}
            data-resource-id={segment.resourceId ?? undefined}
        >
            <div className="time-grid-view_event-color-bar" />
            <div className="time-grid-view_event-content">
                <span className="time-grid-view_event-title" style={event.titleStyle}>
                    {event.title}
                </span>
                {event.description && (
                    <span className="time-grid-view_event-description" style={event.descriptionStyle}>
                        {event.description}
                    </span>
                )}
            </div>
        </div>
    );
}
