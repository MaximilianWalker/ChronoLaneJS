import { useMemo } from "react";
import type { ComponentType } from "react";

import type {
    CalendarEvent,
    CalendarResourceConfig,
    NormalizedCalendarEvent
} from "../../types.js";
import { toEventSegment } from "./contracts.js";
import DefaultBackground from "./DefaultBackground.js";
import type { EventRendering } from "./eventModel.js";
import type { TimedInteractions } from "./interactions/types.js";
import type {
    Layout,
    LayoutEvent,
    LayoutEventSegment
} from "./layout/types.js";
import { createTimedMovePreview } from "./preview.js";
import type { ResizeInterval } from "./resize.js";
import TimedEvent from "./TimedEvent.js";
import type { BackgroundEventProps } from "./types.js";

interface BackgroundOccurrenceProps<
    Event extends CalendarEvent,
    Resource
> {
    segment: LayoutEventSegment<Event, Resource>;
    backgroundRenderer: ComponentType<BackgroundEventProps<Event, Resource>>;
}

function BackgroundOccurrence<Event extends CalendarEvent, Resource>({
    segment,
    backgroundRenderer: BackgroundRenderer
}: BackgroundOccurrenceProps<Event, Resource>) {
    return (
        <BackgroundRenderer
            event={segment.event}
            segment={toEventSegment<Resource>(segment)}
            elementProps={{
                className: "time-grid-view_background-event",
                "aria-hidden": true,
                style: {
                    "--color": segment.event.color,
                    gridColumn: "1 / 2",
                    gridRow: `${segment.startRow} / ${segment.endRow}`,
                    ...segment.event.style
                }
            }}
        />
    );
}

interface TimedEventsProps<Event extends CalendarEvent, Resource> {
    layout: Pick<
        Layout<Event, Resource>,
        "columns" | "slots" | "timeWindow" | "totalMinutes"
    >;
    eventsByColumn: LayoutEvent<Event, Resource>[][];
    backgroundEventsByColumn: LayoutEventSegment<Event, Resource>[][];
    backgroundRenderer?: ComponentType<BackgroundEventProps<Event, Resource>>;
    getBackgroundEventKey: (
        event: NormalizedCalendarEvent<Event>
    ) => string;
    resizeIntervals: ResizeInterval<Resource>[];
    resources?: CalendarResourceConfig<Event, Resource>;
    rendering: EventRendering<Event, Resource>;
    interactions: TimedInteractions<Event, Resource>;
}

export default function TimedEvents<
    Event extends CalendarEvent,
    Resource
>({
    layout: { columns, slots, timeWindow, totalMinutes },
    eventsByColumn,
    backgroundEventsByColumn,
    backgroundRenderer: BackgroundRenderer = DefaultBackground,
    getBackgroundEventKey,
    resizeIntervals,
    resources,
    rendering,
    interactions
}: TimedEventsProps<Event, Resource>) {
    const { move } = interactions;
    const gridRows = `repeat(${totalMinutes}, minmax(0, 1fr))`;
    const movePreview = useMemo(() => createTimedMovePreview({
        move,
        columns,
        timeWindow,
        resources,
        text: rendering.text
    }), [columns, move, rendering.text, resources, timeWindow]);

    return (
        <div
            className="time-grid-view_event-layer"
            style={{ gridTemplateRows: gridRows }}
        >
            <div
                role="status"
                aria-atomic="true"
                className="time-grid-view_live-region"
            >
                {movePreview?.announcement}
            </div>
            {movePreview?.segments.map(({ key, style }) => (
                <div
                    key={key}
                    aria-hidden="true"
                    className="time-grid-view_move-preview"
                    style={style}
                />
            ))}
            {columns.map((column, columnIndex) => (
                <div
                    key={`${column.key}-backgrounds`}
                    className="time-grid-view_background-events"
                    style={{
                        gridColumn: columnIndex + 1,
                        gridRow: `1 / ${totalMinutes + 1}`,
                        gridTemplateColumns: "minmax(0, 1fr)",
                        gridTemplateRows: gridRows
                    }}
                >
                    {(backgroundEventsByColumn[columnIndex] ?? []).map((segment) => {
                        const occurrenceKey = `${getBackgroundEventKey(segment.event)}:background:${columnIndex}`;

                        return (
                            <BackgroundOccurrence
                                key={occurrenceKey}
                                segment={segment}
                                backgroundRenderer={BackgroundRenderer}
                            />
                        );
                    })}
                </div>
            ))}
            {columns.map((column, columnIndex) => (
                <div
                    key={`${column.key}-events`}
                    className="time-grid-view_column-events"
                    data-column-index={columnIndex}
                    data-day-index={column.dayIndex}
                    style={{
                        gridColumn: columnIndex + 1,
                        gridRow: `1 / ${totalMinutes + 1}`,
                        gridTemplateColumns: "minmax(0, 1fr)",
                        gridTemplateRows: gridRows
                    }}
                >
                    {(eventsByColumn[columnIndex] ?? []).map((segment) => {
                        const occurrenceKey = `${rendering.getEventKey(segment.event)}:timed:${segment.columnIndex}`;

                        return (
                            <TimedEvent
                                key={occurrenceKey}
                                occurrenceKey={occurrenceKey}
                                segment={segment}
                                slots={slots}
                                resizeIntervals={resizeIntervals}
                                rendering={rendering}
                                interactions={interactions}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
