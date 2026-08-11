import type { ElementType } from "react";

import type { TimeGridEventProps } from "./types.js";

export default function EventBlock({
    className,
    event,
    dayIndex,
    columnIndex,
    laneIndex,
    laneCount,
    resourceId,
    onClick,
    onDoubleClick,
    onKeyDown,
    onDragStart,
    onDragEnd,
    draggable,
    style,
    titleStyle,
    descriptionStyle,
    "aria-label": ariaLabel,
    "aria-keyshortcuts": ariaKeyShortcuts
}: TimeGridEventProps) {
    const isInteractive = Boolean(onClick || onDoubleClick);
    const Component: ElementType = isInteractive ? "button" : "div";

    return (
        <Component
            type={isInteractive ? "button" : undefined}
            aria-label={isInteractive ? ariaLabel : undefined}
            aria-keyshortcuts={ariaKeyShortcuts}
            className={`${className} ${event.variant ?? "default"}`}
            data-event-id={event.id}
            data-day-index={dayIndex}
            data-column-index={columnIndex}
            data-lane-index={laneIndex}
            data-lane-count={laneCount}
            data-resource-id={resourceId}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            draggable={draggable}
            style={style}
        >
            <div className="time-grid-view_event-color-bar" />
            <div className="time-grid-view_event-content">
                <span className="time-grid-view_event-title" style={titleStyle}>
                    {event.title}
                </span>
                {event.description && (
                    <span className="time-grid-view_event-description" style={descriptionStyle}>
                        {event.description}
                    </span>
                )}
            </div>
        </Component>
    );
}
