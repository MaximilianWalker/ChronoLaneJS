import type { EventProps } from "./types.js";

/**
 * Renders the default positioned time-grid event.
 *
 * Layout styles and event-root interactions are supplied by the grid. Move
 * and resize controls remain independent siblings owned by the view.
 */
export default function DefaultEvent({
    event,
    segment,
    selected,
    elementProps
}: EventProps) {
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
