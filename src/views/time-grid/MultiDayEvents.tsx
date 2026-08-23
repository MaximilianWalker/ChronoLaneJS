import { useMemo } from "react";
import type { RefObject } from "react";

import type {
    CalendarEvent,
    CalendarResourceConfig,
    CalendarStyle
} from "../../types.js";
import type { EventRendering } from "./eventModel.js";
import type { MultiDayInteractions } from "./interactions/types.js";
import {
    createMultiDayEventDrop,
    createMultiDayEventPreview,
    createMultiDayEventResize
} from "./layout/multiDayEvents.js";
import type { MultiDayEventLayout as Layout } from "./layout/multiDayEvents.js";
import type { LayoutColumn } from "./layout/types.js";
import MultiDayEvent from "./MultiDayEvent.js";
import { resolveCalendarResourceTitle } from "./resources.js";

interface MultiDayEventsProps<Event extends CalendarEvent, Resource> {
    layout: Layout<Event, Resource>;
    columns: LayoutColumn<Resource>[];
    resources?: CalendarResourceConfig<Event, Resource>;
    rendering: EventRendering<Event, Resource>;
    interactions: MultiDayInteractions<Event, Resource>;
    gridRef: RefObject<HTMLDivElement | null>;
}

export default function MultiDayEvents<
    Event extends CalendarEvent,
    Resource
>({
    layout,
    columns,
    resources,
    rendering,
    interactions,
    gridRef
}: MultiDayEventsProps<Event, Resource>) {
    const { formatters, messages, context } = rendering.text;
    const { move, resize } = interactions;
    const movePreview = useMemo(() => {
        if (!move?.target) return null;

        const change = createMultiDayEventDrop(move.segment, move.target);
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
            laneIndex: move.segment.laneIndex,
            segments: createMultiDayEventPreview({
                event: move.segment.event,
                start: change.start,
                end: change.end,
                resourceId: change.destination.resourceId,
                columns
            })
        };
    }, [
        columns,
        context,
        formatters,
        messages,
        move,
        resources
    ]);
    const resizePreview = useMemo(() => {
        if (resize?.targetOffset == null) return null;

        const change = createMultiDayEventResize({
            event: resize.segment.event,
            edge: resize.edge,
            dayOffset: resize.targetOffset,
            source: resize.source
        });

        return {
            color: resize.segment.event.color,
            laneIndex: resize.segment.laneIndex,
            segments: createMultiDayEventPreview({
                event: resize.segment.event,
                start: change.start,
                end: change.end,
                resourceId: resize.source.resourceId,
                columns
            })
        };
    }, [columns, resize]);

    if (layout.events.length === 0) return null;

    return (
        <section
            className="time-grid-view_multi-day-region"
            aria-label={messages.multiDayRegionLabel({ view: context.view })}
        >
            <div
                role="status"
                aria-atomic="true"
                className="time-grid-view_live-region"
            >
                {movePreview?.announcement}
            </div>
            <div
                className="time-grid-view_multi-day-label"
                aria-hidden="true"
            >
                {messages.multiDayRegionLabel({ view: context.view })}
            </div>
            <div
                ref={gridRef}
                className="time-grid-view_multi-day-grid"
                style={{
                    gridTemplateRows: `repeat(${layout.laneCount}, minmax(30px, auto))`
                }}
            >
                {columns.map((column, columnIndex) => (
                    <div
                        key={`${column.key}-multi-day-column`}
                        aria-hidden="true"
                        className="time-grid-view_multi-day-column"
                        style={{
                            gridColumn: columnIndex + 1,
                            gridRow: `1 / ${layout.laneCount + 1}`
                        }}
                    />
                ))}
                {movePreview?.segments.map((segment) => (
                    <div
                        key={`${segment.columnIndex}-${segment.columnSpan}`}
                        aria-hidden="true"
                        className="time-grid-view_move-preview is-multi-day"
                        style={{
                            "--color": movePreview.color,
                            gridColumn: `${segment.columnIndex + 1} / span ${segment.columnSpan}`,
                            gridRow: movePreview.laneIndex + 1
                        } as CalendarStyle}
                    />
                ))}
                {resizePreview?.segments.map((segment) => (
                    <div
                        key={`${segment.columnIndex}-${segment.columnSpan}`}
                        aria-hidden="true"
                        className="time-grid-view_resize-preview is-multi-day"
                        style={{
                            "--color": resizePreview.color,
                            gridColumn: `${segment.columnIndex + 1} / span ${segment.columnSpan}`,
                            gridRow: resizePreview.laneIndex + 1
                        } as CalendarStyle}
                    />
                ))}
                {layout.events.map((segment) => {
                    const occurrenceKey = `${rendering.getEventKey(segment.event)}:dedicated:${segment.columnIndex}`;

                    return (
                        <MultiDayEvent
                            key={occurrenceKey}
                            occurrenceKey={occurrenceKey}
                            segment={segment}
                            columns={columns}
                            rendering={rendering}
                            interactions={interactions}
                            gridRef={gridRef}
                        />
                    );
                })}
            </div>
        </section>
    );
}
