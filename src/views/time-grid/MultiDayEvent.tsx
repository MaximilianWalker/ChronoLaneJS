import type { RefObject } from "react";

import type {
    CalendarEvent,
    CalendarStyle
} from "../../types.js";
import { createEventModel } from "./eventModel.js";
import type { EventRendering } from "./eventModel.js";
import {
    handleMultiDayMoveBlur,
    handleMultiDayMoveKeyDown,
    handleMultiDayMovePointerDown,
    handleMultiDayResizeBlur,
    handleMultiDayResizeKeyDown,
    handleMultiDayResizePointerDown
} from "./interactions/multiDayControls.js";
import type { MultiDayInteractions } from "./interactions/types.js";
import {
    createMultiDayEventResize,
    getMultiDayResizeOffset
} from "./layout/multiDayEvents.js";
import type { LayoutMultiDayEvent } from "./layout/multiDayEvents.js";
import type { LayoutColumn } from "./layout/types.js";
import type {
    EventResizeEdge,
    EventPosition,
    EventSegment
} from "./types.js";

interface ResizeRange<Resource> {
    source: EventPosition<Resource>;
    dayOffsets: number[];
    boundaries: Date[];
}

const createResizeRange = <Event extends CalendarEvent, Resource>(
    segment: LayoutMultiDayEvent<Event, Resource>,
    edge: EventResizeEdge,
    columns: LayoutColumn<Resource>[]
): ResizeRange<Resource> => {
    const source = {
        day: segment.day,
        resource: segment.resource,
        resourceId: segment.resourceId
    };
    const dayOffsets = [...new Set(columns
        .filter((column) => column.resourceId === segment.resourceId)
        .map((column) => getMultiDayResizeOffset(
            segment.event,
            edge,
            column.day
        ))
        .filter((dayOffset) => {
            const change = createMultiDayEventResize({
                event: segment.event,
                edge,
                dayOffset,
                source
            });
            return change.end > change.start;
        }))].sort((first, second) => first - second);
    const boundaries = dayOffsets.map((dayOffset) => (
        createMultiDayEventResize({
            event: segment.event,
            edge,
            dayOffset,
            source
        })[edge]
    ));

    return { source, dayOffsets, boundaries };
};

interface ControlProps<Event extends CalendarEvent, Resource> {
    segment: LayoutMultiDayEvent<Event, Resource>;
    rendererSegment: EventSegment<Resource>;
    eventKey: string;
    columns: LayoutColumn<Resource>[];
    rendering: EventRendering<Event, Resource>;
    interactions: MultiDayInteractions<Event, Resource>;
}

interface MoveControlProps<Event extends CalendarEvent, Resource>
    extends ControlProps<Event, Resource> {
    eventStyle: CalendarStyle;
    gridRef: RefObject<HTMLDivElement | null>;
}

function MoveControl<Event extends CalendarEvent, Resource>({
    segment,
    eventKey,
    eventStyle,
    columns,
    gridRef,
    rendering,
    interactions
}: MoveControlProps<Event, Resource>) {
    const handleKey = `${eventKey}-move`;
    const active = interactions.move?.handleKey === handleKey;
    const options = { segment, handleKey, columns, gridRef, interactions };

    return (
        <div
            className="time-grid-view_event-move-controls"
            style={eventStyle}
        >
            <button
                type="button"
                className="time-grid-view_event-move-handle"
                data-event-id={segment.event.id}
                data-moving={active || undefined}
                aria-label={rendering.text.messages.eventMoveHandle({
                    view: rendering.text.context.view,
                    title: segment.event.title
                })}
                aria-keyshortcuts="ArrowLeft ArrowRight Enter Escape"
                onBlur={() => handleMultiDayMoveBlur(handleKey, interactions)}
                onKeyDown={(interaction) => (
                    handleMultiDayMoveKeyDown(interaction, options)
                )}
                onPointerDown={(interaction) => (
                    handleMultiDayMovePointerDown(interaction, options)
                )}
                onPointerMove={interactions.handleMovePointerMove}
                onPointerUp={interactions.handleMovePointerUp}
                onPointerCancel={interactions.handleMovePointerCancel}
            >
                <span aria-hidden="true">↔</span>
            </button>
        </div>
    );
}

interface ResizeControlProps<Event extends CalendarEvent, Resource>
    extends ControlProps<Event, Resource> {
    edge: EventResizeEdge;
}

function ResizeControl<Event extends CalendarEvent, Resource>({
    segment,
    rendererSegment,
    eventKey,
    edge,
    columns,
    rendering,
    interactions
}: ResizeControlProps<Event, Resource>) {
    const { event } = segment;
    const boundaryVisible = event[edge].getTime() === segment[edge].getTime();
    const allowed = boundaryVisible
        && (rendering.canResize?.(event, rendererSegment, edge) ?? true);
    if (!allowed) return null;

    const { source, dayOffsets, boundaries } = createResizeRange(
        segment,
        edge,
        columns
    );
    if (dayOffsets.length === 0) return null;

    const handleKey = `${eventKey}-${edge}`;
    const active = interactions.resize?.handleKey === handleKey
        ? interactions.resize
        : null;
    const currentOffset = active?.targetOffset ?? 0;
    const currentChange = createMultiDayEventResize({
        event,
        edge,
        dayOffset: currentOffset,
        source
    });
    const currentBoundary = currentChange[edge];
    const firstBoundary = boundaries[0];
    const lastBoundary = boundaries.at(-1);
    if (!firstBoundary || !lastBoundary) return null;

    const { formatters, messages, context } = rendering.text;
    const options = {
        segment,
        edge,
        handleKey,
        dayOffsets,
        interactions
    };

    return (
        <div
            role="slider"
            tabIndex={0}
            className={`time-grid-view_multi-day-resize-handle is-${edge}`}
            data-event-id={event.id}
            data-resize-edge={edge}
            aria-label={messages.eventResizeHandle({
                view: context.view,
                edge,
                title: event.title,
                date: formatters.date(currentBoundary, context),
                time: formatters.time(currentBoundary, context)
            })}
            aria-orientation="horizontal"
            aria-valuemin={firstBoundary.getTime()}
            aria-valuemax={lastBoundary.getTime()}
            aria-valuenow={currentBoundary.getTime()}
            aria-valuetext={messages.slotLabel({
                view: context.view,
                date: formatters.date(currentBoundary, context),
                time: formatters.time(currentBoundary, context)
            })}
            onBlur={() => handleMultiDayResizeBlur(handleKey, interactions)}
            onKeyDown={(interaction) => (
                handleMultiDayResizeKeyDown(interaction, options)
            )}
            onPointerDown={(interaction) => (
                handleMultiDayResizePointerDown(interaction, options)
            )}
            onPointerMove={interactions.handleResizePointerMove}
            onPointerUp={interactions.handleResizePointerUp}
            onPointerCancel={interactions.handleResizePointerCancel}
            style={{
                color: event.color,
                gridColumn: `${segment.columnIndex + 1} / span ${segment.columnSpan}`,
                gridRow: segment.laneIndex + 1,
                justifySelf: edge === "start" ? "start" : "end"
            }}
        />
    );
}

interface MultiDayEventProps<Event extends CalendarEvent, Resource> {
    segment: LayoutMultiDayEvent<Event, Resource>;
    columns: LayoutColumn<Resource>[];
    rendering: EventRendering<Event, Resource>;
    interactions: MultiDayInteractions<Event, Resource>;
    gridRef: RefObject<HTMLDivElement | null>;
}

export default function MultiDayEvent<
    Event extends CalendarEvent,
    Resource
>({
    segment,
    columns,
    rendering,
    interactions,
    gridRef
}: MultiDayEventProps<Event, Resource>) {
    const { event } = segment;
    const model = createEventModel({
        event,
        segment,
        layout: "dedicated",
        rendering
    });
    const eventKey = `${event.id ?? event.title ?? "event"}-${event.start.getTime()}-${event.end.getTime()}-${segment.columnIndex}-multi-day`;
    const eventStyle: CalendarStyle = {
        "--color": event.color,
        gridColumn: `${segment.columnIndex + 1} / span ${segment.columnSpan}`,
        gridRow: segment.laneIndex + 1,
        overflow: "hidden"
    };
    const EventRenderer = rendering.renderer;
    const controls = {
        segment,
        rendererSegment: model.segment,
        eventKey,
        columns,
        rendering,
        interactions
    };

    return (
        <>
            <EventRenderer
                event={event}
                segment={model.segment}
                selected={model.selected}
                elementProps={{
                    className: "time-grid-view_event time-grid-view_multi-day-event",
                    ...model.interactionProps,
                    "aria-label": model.ariaLabel,
                    style: { ...eventStyle, ...event.style }
                }}
            />
            {model.movable && (
                <MoveControl
                    {...controls}
                    eventStyle={eventStyle}
                    gridRef={gridRef}
                />
            )}
            {rendering.resizeEnabled && (
                <>
                    <ResizeControl {...controls} edge="start" />
                    <ResizeControl {...controls} edge="end" />
                </>
            )}
        </>
    );
}
