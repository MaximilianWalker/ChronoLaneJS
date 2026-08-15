import type { ElementType } from "react";

import type { TimeGridEventProps } from "./types.js";

/**
 * Renders the default positioned time-grid event.
 *
 * Layout styles are supplied by the grid. The root becomes a button when click
 * or edit behavior is available and retains native drag support when enabled.
 */
export default function Event({
    event,
    segment,
    selected,
    elementProps
}: TimeGridEventProps) {
    const isInteractive = Boolean(elementProps.onClick || elementProps.onDoubleClick);
    const Component: ElementType = isInteractive ? "button" : "div";

    return (
        <Component
            {...elementProps}
            type={isInteractive ? "button" : undefined}
            className={`${elementProps.className}${selected ? " is-selected" : ""} ${event.variant ?? "default"}`}
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
        </Component>
    );
}
