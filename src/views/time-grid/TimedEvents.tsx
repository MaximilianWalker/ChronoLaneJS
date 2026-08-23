import { useMemo } from "react";
import type { ComponentType } from "react";

import type {
    CalendarEvent,
    CalendarResourceConfig,
    CalendarStyle,
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
import { createEventDrop } from "./move.js";
import { createEventPreviewSegments } from "./preview.js";
import { createEventResize } from "./resize.js";
import type { ResizeInterval } from "./resize.js";
import { resolveCalendarResourceTitle } from "./resources.js";
import TimedEvent from "./TimedEvent.js";
import type { BackgroundEventProps } from "./types.js";

interface BackgroundOccurrenceProps<
    Event extends CalendarEvent,
    Resource
> {
    segment: LayoutEventSegment<Event, Resource>;
    renderer: ComponentType<BackgroundEventProps<Event, Resource>>;
}

function BackgroundOccurrence<Event extends CalendarEvent, Resource>({
    segment,
    renderer: Renderer
}: BackgroundOccurrenceProps<Event, Resource>) {
    return (
        <Renderer
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
    const { formatters, messages, context } = rendering.text;
    const { move, resize } = interactions;
    const gridRows = `repeat(${totalMinutes}, minmax(0, 1fr))`;
    const movePreview = useMemo(() => {
        if (!move?.target) return null;

        const change = createEventDrop(move.segment, move.target);
        const resourceTitle = move.target.resource == null
            || move.target.resourceId == null
            ? null
            : resolveCalendarResourceTitle(
                resources,
                move.target.resource,
                move.target.resourceId
            );
        const resource = typeof resourceTitle === "string"
            || typeof resourceTitle === "number"
            ? String(resourceTitle)
            : move.target.resourceId == null
                ? undefined
                : String(move.target.resourceId);

        return {
            announcement: messages.eventMoveTarget({
                view: context.view,
                title: move.segment.event.title,
                date: formatters.date(change.start, context),
                time: formatters.time(change.start, context),
                resource
            }),
            color: move.segment.event.color,
            segments: createEventPreviewSegments({
                start: change.start,
                end: change.end,
                resourceId: change.destination.resourceId,
                columns,
                timeWindow
            })
        };
    }, [
        columns,
        context,
        formatters,
        messages,
        move,
        resources,
        timeWindow
    ]);
    const resizePreview = useMemo(() => {
        if (!resize?.target) return null;

        const change = createEventResize(
            resize.event,
            resize.edge,
            resize.target,
            resize.source
        );

        return {
            color: resize.event.color,
            segments: createEventPreviewSegments({
                start: change.start,
                end: change.end,
                resourceId: resize.source.resourceId,
                columns,
                timeWindow
            })
        };
    }, [columns, resize, timeWindow]);

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
            {movePreview?.segments.map((segment) => (
                <div
                    key={segment.columnIndex}
                    aria-hidden="true"
                    className="time-grid-view_move-preview"
                    style={{
                        "--color": movePreview.color,
                        gridColumn: segment.columnIndex + 1,
                        gridRow: `${segment.startRow} / ${segment.endRow}`
                    } as CalendarStyle}
                />
            ))}
            {resizePreview?.segments.map((segment) => (
                <div
                    key={segment.columnIndex}
                    aria-hidden="true"
                    className="time-grid-view_resize-preview"
                    style={{
                        "--color": resizePreview.color,
                        gridColumn: segment.columnIndex + 1,
                        gridRow: `${segment.startRow} / ${segment.endRow}`
                    } as CalendarStyle}
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
                                renderer={BackgroundRenderer}
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
