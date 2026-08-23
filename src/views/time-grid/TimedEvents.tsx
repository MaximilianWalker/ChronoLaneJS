import {
    Fragment,
    useMemo
} from "react";
import type {
    ComponentType,
    KeyboardEvent,
    PointerEvent
} from "react";

import type {
    CalendarEvent,
    CalendarResourceConfig,
    CalendarStyle
} from "../../types.js";
import DefaultBackground from "./DefaultBackground.js";
import { toEventSegment } from "./contracts.js";
import type { Layout } from "./layout/types.js";
import type {
    LayoutEvent,
    LayoutEventSegment
} from "./layout/types.js";
import {
    createEventDrop,
    findAdjacentMoveSlot
} from "./move.js";
import { createEventPreviewSegments } from "./preview.js";
import { createEventPresentation } from "./rendering.js";
import type { EventRendering } from "./rendering.js";
import {
    createEventResize,
    createResizeBoundaries,
    findAdjacentResizeBoundary
} from "./resize.js";
import type { ResizeInterval } from "./resize.js";
import { resolveCalendarResourceTitle } from "./resources.js";
import type {
    BackgroundEventProps
} from "./types.js";
import type { TimedInteractions } from "./interactions.js";

const percentage = (value: number): number => Number(value.toFixed(6));

const getLaneStyle = ({
    laneIndex,
    laneCount
}: Pick<LayoutEvent, "laneIndex" | "laneCount">): CalendarStyle => {
    const laneWidth = 100 / laneCount;

    return {
        width: `calc(${percentage(laneWidth)}% - 4px)`,
        marginLeft: `calc(${percentage(laneIndex * laneWidth)}% + 2px)`,
        marginRight: "2px"
    };
};

interface TimedEventsProps<
    Event extends CalendarEvent,
    Resource
> {
    layout: Pick<
        Layout<Event, Resource>,
        "columns" | "slots" | "timeWindow" | "totalMinutes"
    >;
    eventsByColumn: LayoutEvent<Event, Resource>[][];
    backgroundEventsByColumn: LayoutEventSegment<Event, Resource>[][];
    backgroundRenderer?: ComponentType<BackgroundEventProps<Event, Resource>>;
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
    resizeIntervals,
    resources,
    rendering,
    interactions
}: TimedEventsProps<Event, Resource>) {
    const {
        renderer: EventRenderer,
        resizeEnabled: canResizeEvents,
        canResize: canResizeEvent,
        formatters,
        messages,
        formatContext,
        viewName
    } = rendering;
    const {
        move: eventMove,
        resize: eventResize,
        beginMove: beginEventMove,
        updateMoveTarget: updateEventMoveTarget,
        cancelMove: cancelEventMove,
        commitMove: commitEventMove,
        handleMovePointerMove,
        handleMovePointerUp,
        handleMovePointerCancel,
        beginResize: beginEventResize,
        updateResize: updateEventResize,
        cancelResize: cancelEventResize,
        commitResize: commitEventResize,
        handleResizePointerMove,
        handleResizePointerUp,
        handleResizePointerCancel
    } = interactions;
    const gridRows = `repeat(${totalMinutes}, minmax(0, 1fr))`;
    const movePreview = useMemo(() => {
        if (!eventMove?.target) return null;

        const change = createEventDrop(eventMove.segment, eventMove.target);
        const resourceTitle = eventMove.target.resource == null
            || eventMove.target.resourceId == null
            ? null
            : resolveCalendarResourceTitle(
                resources,
                eventMove.target.resource,
                eventMove.target.resourceId
            );
        const resource = typeof resourceTitle === "string"
            || typeof resourceTitle === "number"
            ? String(resourceTitle)
            : eventMove.target.resourceId == null
                ? undefined
                : String(eventMove.target.resourceId);

        return {
            announcement: messages.eventMoveTarget({
                view: viewName,
                title: eventMove.segment.event.title,
                date: formatters.date(change.start, formatContext),
                time: formatters.time(change.start, formatContext),
                resource
            }),
            color: eventMove.segment.event.color,
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
        eventMove,
        formatContext,
        formatters,
        messages,
        resources,
        timeWindow,
        viewName
    ]);
    const resizePreview = useMemo(() => {
        if (!eventResize?.target) return null;

        const change = createEventResize(
            eventResize.event,
            eventResize.edge,
            eventResize.target,
            eventResize.source
        );

        return {
            color: eventResize.event.color,
            segments: createEventPreviewSegments({
                start: change.start,
                end: change.end,
                resourceId: eventResize.source.resourceId,
                columns,
                timeWindow
            })
        };
    }, [columns, eventResize, timeWindow]);

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
                        const rendererSegment = toEventSegment<Resource>(
                            segment
                        );

                        return (
                            <BackgroundRenderer
                                key={`${segment.id ?? "background"}-${segment.start.getTime()}-${columnIndex}`}
                                event={segment.event}
                                segment={rendererSegment}
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
                        const { event } = segment;
                        const presentation = createEventPresentation({
                            event,
                            segment,
                            rendering
                        });
                        const {
                            segment: rendererSegment,
                            selected,
                            movable,
                            interactionProps,
                            ariaLabel
                        } = presentation;
                        const eventKey = `${event.id ?? event.title ?? "event"}-${event.start.getTime()}-${event.end.getTime()}-${segment.columnIndex}`;
                        const moveHandleKey = `${eventKey}-move`;
                        const activeMove = eventMove?.handleKey === moveHandleKey
                            ? eventMove
                            : null;

                        const handleMoveKeyDown = (
                            interaction: KeyboardEvent<HTMLElement>
                        ) => {
                            interaction.stopPropagation();
                            const current = eventMove?.handleKey === moveHandleKey
                                ? eventMove
                                : null;

                            if (interaction.key === "Escape" && current) {
                                interaction.preventDefault();
                                cancelEventMove();
                                return;
                            }
                            if (interaction.key === "Enter" && current) {
                                interaction.preventDefault();
                                commitEventMove(current);
                                return;
                            }

                            const direction = interaction.key === "ArrowUp"
                                ? "up"
                                : interaction.key === "ArrowDown"
                                    ? "down"
                                    : interaction.key === "ArrowLeft"
                                        ? "left"
                                        : interaction.key === "ArrowRight"
                                            ? "right"
                                            : null;
                            if (direction == null) return;
                        
                            interaction.preventDefault();
                            const nextState = current ?? beginEventMove(
                                segment,
                                moveHandleKey
                            );
                            if (!nextState) return;
                        
                            const position = nextState.target ?? nextState.origin;
                            const target = findAdjacentMoveSlot(slots, {
                                columnIndex: position.columnIndex,
                                timeIndex: position.timeIndex,
                                start: nextState.target?.start ?? segment.start
                            }, direction);
                            if (target) {
                                updateEventMoveTarget(nextState, target, true);
                            }
                        };
                        
                        const handleMovePointerDown = (
                            interaction: PointerEvent<HTMLElement>
                        ) => {
                            interaction.preventDefault();
                            interaction.stopPropagation();
                            const next = beginEventMove(
                                segment,
                                moveHandleKey,
                                interaction.pointerId
                            );
                            if (!next) return;
                        
                            if (interaction.nativeEvent.isTrusted) {
                                interaction.currentTarget.setPointerCapture(
                                    interaction.pointerId
                                );
                            }
                        };
                        
                        return (
                            <Fragment key={eventKey}>
                                <EventRenderer
                                    event={event}
                                    segment={rendererSegment}
                                    selected={selected}
                                    elementProps={{
                                        className: "time-grid-view_event",
                                        ...interactionProps,
                                        "aria-label": ariaLabel,
                                        style: {
                                            "--color": event.color,
                                            gridColumn: "1 / 2",
                                            gridRow: `${segment.startRow} / ${segment.endRow}`,
                                            overflow: "hidden",
                                            ...getLaneStyle(segment),
                                            ...event.style
                                        }
                                    }}
                                />
                                {movable && (
                                    <div
                                        className="time-grid-view_event-move-controls"
                                        style={{
                                            gridColumn: "1 / 2",
                                            gridRow: `${segment.startRow} / ${segment.endRow}`,
                                            ...getLaneStyle(segment)
                                        }}
                                    >
                                        <button
                                            type="button"
                                            className="time-grid-view_event-move-handle"
                                            data-event-id={event.id}
                                            data-moving={activeMove != null || undefined}
                                            aria-label={messages.eventMoveHandle({
                                                view: viewName,
                                                title: event.title
                                            })}
                                            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter Escape"
                                            onBlur={() => {
                                                if (eventMove?.handleKey === moveHandleKey) {
                                                    commitEventMove(eventMove);
                                                }
                                            }}
                                            onKeyDown={handleMoveKeyDown}
                                            onPointerDown={handleMovePointerDown}
                                            onPointerMove={handleMovePointerMove}
                                            onPointerUp={handleMovePointerUp}
                                            onPointerCancel={handleMovePointerCancel}
                                        >
                                            <span aria-hidden="true">↕</span>
                                        </button>
                                    </div>
                                )}
                                {canResizeEvents && (["start", "end"] as const).map((edge) => {
                                    const boundaryVisible = event[edge].getTime()
                                        === segment[edge].getTime();
                                    const allowed = boundaryVisible
                                        && (canResizeEvent?.(
                                            event,
                                            rendererSegment,
                                            edge
                                        ) ?? true);
                                    if (!allowed) return null;

                                    const boundaries = createResizeBoundaries({
                                        event,
                                        edge,
                                        resourceId: segment.resourceId,
                                        intervals: resizeIntervals
                                    });
                                    if (boundaries.length === 0) return null;

                                    const handleKey = `${eventKey}-${edge}`;
                                    const activeResize = eventResize?.handleKey === handleKey
                                        ? eventResize
                                        : null;
                                    const currentBoundary = activeResize?.target?.date
                                        ?? event[edge];
                                    const firstBoundary = boundaries[0];
                                    const lastBoundary = boundaries.at(-1);
                                    if (!firstBoundary || !lastBoundary) return null;
                                    const currentValue = currentBoundary.getTime();
                                    const minimumValue = Math.min(
                                        firstBoundary.date.getTime(),
                                        currentValue
                                    );
                                    const maximumValue = Math.max(
                                        lastBoundary.date.getTime(),
                                        currentValue
                                    );

                                    const handleKeyDown = (
                                        interaction: KeyboardEvent<HTMLElement>
                                    ) => {
                                        interaction.stopPropagation();
                                        const current = eventResize?.handleKey
                                            === handleKey
                                            ? eventResize
                                            : null;

                                        if (interaction.key === "Escape" && current) {
                                            interaction.preventDefault();
                                            cancelEventResize();
                                            return;
                                        }
                                        if (interaction.key === "Enter" && current) {
                                            interaction.preventDefault();
                                            commitEventResize(current);
                                            return;
                                        }
                        
                                        const direction = interaction.key === "ArrowUp"
                                            || interaction.key === "ArrowLeft"
                                            ? -1
                                            : interaction.key === "ArrowDown"
                                                || interaction.key === "ArrowRight"
                                                ? 1
                                                : null;
                                        if (direction == null) return;
                        
                                        interaction.preventDefault();
                                        const nextState = current ?? beginEventResize(
                                            event,
                                            segment,
                                            edge,
                                            handleKey,
                                            boundaries
                                        );
                                        if (!nextState) return;
                        
                                        const adjacent = findAdjacentResizeBoundary(
                                            nextState.boundaries,
                                            nextState.target?.date ?? event[edge],
                                            direction
                                        );
                                        if (adjacent) {
                                            updateEventResize({
                                                ...nextState,
                                                target: adjacent
                                            });
                                        }
                                    };
                        
                                    const handlePointerDown = (
                                        interaction: PointerEvent<HTMLElement>
                                    ) => {
                                        interaction.preventDefault();
                                        interaction.stopPropagation();
                                        const next = beginEventResize(
                                            event,
                                            segment,
                                            edge,
                                            handleKey,
                                            boundaries,
                                            interaction.pointerId
                                        );
                                        if (!next) return;
                        
                                        if (interaction.nativeEvent.isTrusted) {
                                            interaction.currentTarget.setPointerCapture(
                                                interaction.pointerId
                                            );
                                        }
                                    };
                        
                                    return (
                                        <div
                                            key={edge}
                                            role="slider"
                                            tabIndex={0}
                                            className={`time-grid-view_event-resize-handle is-${edge}`}
                                            data-event-id={event.id}
                                            data-resize-edge={edge}
                                            aria-label={messages.eventResizeHandle({
                                                view: viewName,
                                                edge,
                                                title: event.title,
                                                date: formatters.date(
                                                    currentBoundary,
                                                    formatContext
                                                ),
                                                time: formatters.time(
                                                    currentBoundary,
                                                    formatContext
                                                )
                                            })}
                                            aria-orientation="vertical"
                                            aria-valuemin={minimumValue}
                                            aria-valuemax={maximumValue}
                                            aria-valuenow={currentValue}
                                            aria-valuetext={messages.slotLabel({
                                                view: viewName,
                                                date: formatters.date(
                                                    currentBoundary,
                                                    formatContext
                                                ),
                                                time: formatters.time(
                                                    currentBoundary,
                                                    formatContext
                                                )
                                            })}
                                            onBlur={() => {
                                                if (eventResize?.handleKey === handleKey) {
                                                    commitEventResize(eventResize);
                                                }
                                            }}
                                            onKeyDown={handleKeyDown}
                                            onPointerDown={handlePointerDown}
                                            onPointerMove={handleResizePointerMove}
                                            onPointerUp={handleResizePointerUp}
                                            onPointerCancel={handleResizePointerCancel}
                                            style={{
                                                color: event.color,
                                                gridColumn: "1 / 2",
                                                gridRow: `${segment.startRow} / ${segment.endRow}`,
                                                alignSelf: edge === "start" ? "start" : "end",
                                                ...getLaneStyle(segment)
                                            }}
                                        />
                                    );
                                })}
                            </Fragment>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
