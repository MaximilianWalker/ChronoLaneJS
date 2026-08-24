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
import {
    appendMoveShortcuts,
    handleMoveSurfaceClick,
    handleMoveSurfaceKeyDown,
    handleMoveSurfacePointerCancel,
    handleMoveSurfacePointerUp
} from "./interactions/moveSurface.js";
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

const MOVE_KEYS = new Set(["ArrowLeft", "ArrowRight"]);

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
    const handleKey = `${eventKey}-${edge}`;
    const active = interactions.resize?.handleKey === handleKey
        ? interactions.resize
        : null;
    const baseEvent = active?.segment.event ?? event;
    const currentOffset = active?.targetOffset ?? 0;
    const currentChange = createMultiDayEventResize({
        event: baseEvent,
        edge,
        dayOffset: currentOffset,
        source: active?.source ?? {
            day: segment.day,
            resource: segment.resource,
            resourceId: segment.resourceId
        }
    });
    const currentBoundary = currentChange[edge];
    const boundaryVisible = currentBoundary.getTime() === segment[edge].getTime();
    const allowed = boundaryVisible
        && (rendering.canResize?.(event, rendererSegment, edge) ?? true);
    if (!allowed) return null;

    const { dayOffsets, boundaries } = createResizeRange(
        segment,
        edge,
        columns
    );
    if (dayOffsets.length === 0) return null;

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
    occurrenceKey: string;
    segment: LayoutMultiDayEvent<Event, Resource>;
    columns: LayoutColumn<Resource>[];
    rendering: EventRendering<Event, Resource>;
    interactions: MultiDayInteractions<Event, Resource>;
}

export default function MultiDayEvent<
    Event extends CalendarEvent,
    Resource
>({
    occurrenceKey,
    segment,
    columns,
    rendering,
    interactions
}: MultiDayEventProps<Event, Resource>) {
    const { event } = segment;
    const model = createEventModel({
        event,
        segment,
        layout: "dedicated",
        rendering
    });
    const eventStyle: CalendarStyle = {
        "--color": event.color,
        gridColumn: `${segment.columnIndex + 1} / span ${segment.columnSpan}`,
        gridRow: segment.laneIndex + 1,
        overflow: "hidden"
    };
    const EventRenderer = rendering.eventRenderer;
    const moveHandleKey = `${occurrenceKey}-move`;
    const moving = interactions.move?.handleKey === moveHandleKey;
    const resizing = interactions.resize?.handleKey.startsWith(
        `${occurrenceKey}-`
    ) ?? false;
    const moveOptions = {
        segment,
        handleKey: moveHandleKey,
        columns,
        interactions
    };
    const controls = {
        segment,
        rendererSegment: model.segment,
        eventKey: occurrenceKey,
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
                    className: `time-grid-view_event time-grid-view_multi-day-event${model.movable
                        ? " is-movable"
                        : ""}${moving ? " is-moving" : ""}${resizing
                        ? " is-resizing"
                        : ""}`,
                    ...model.interactionProps,
                    tabIndex: model.movable
                        ? 0
                        : model.interactionProps.tabIndex,
                    "aria-label": model.ariaLabel,
                    "aria-description": model.movable
                        ? rendering.text.messages.eventMoveHandle({
                            view: rendering.text.context.view,
                            title: event.title
                        })
                        : undefined,
                    "aria-keyshortcuts": model.movable
                        ? appendMoveShortcuts(
                            model.interactionProps["aria-keyshortcuts"],
                            "ArrowLeft ArrowRight Enter Escape"
                        )
                        : model.interactionProps["aria-keyshortcuts"],
                    title: model.details,
                    onBlur: model.movable
                        ? () => handleMultiDayMoveBlur(
                            moveHandleKey,
                            interactions
                        )
                        : undefined,
                    onClick: model.movable
                        ? (interaction) => handleMoveSurfaceClick(
                            interaction,
                            model.interactionProps.onClick
                        )
                        : model.interactionProps.onClick,
                    onKeyDown: model.movable
                        ? (interaction) => handleMoveSurfaceKeyDown(
                            interaction,
                            moving,
                            MOVE_KEYS,
                            (moveInteraction) => handleMultiDayMoveKeyDown(
                                moveInteraction,
                                moveOptions
                            ),
                            model.interactionProps.onKeyDown
                        )
                        : model.interactionProps.onKeyDown,
                    onPointerDown: model.movable
                        ? (interaction) => handleMultiDayMovePointerDown(
                            interaction,
                            moveOptions
                        )
                        : undefined,
                    onPointerMove: model.movable
                        ? interactions.handleMovePointerMove
                        : undefined,
                    onPointerUp: model.movable
                        ? (interaction) => handleMoveSurfacePointerUp(
                            interaction,
                            interactions.handleMovePointerUp,
                            model.interactionProps.onPointerUp
                        )
                        : model.interactionProps.onPointerUp,
                    onPointerCancel: model.movable
                        ? (interaction) => handleMoveSurfacePointerCancel(
                            interaction,
                            interactions.handleMovePointerCancel,
                            model.interactionProps.onPointerCancel
                        )
                        : model.interactionProps.onPointerCancel,
                    style: { ...eventStyle, ...event.style }
                }}
            />
            {rendering.resizeEnabled && (
                <>
                    <ResizeControl {...controls} edge="start" />
                    <ResizeControl {...controls} edge="end" />
                </>
            )}
        </>
    );
}
