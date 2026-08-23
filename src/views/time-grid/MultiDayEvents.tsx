import {
    Fragment,
    useMemo
} from "react";
import type {
    KeyboardEvent,
    PointerEvent,
    RefObject
} from "react";

import type {
    CalendarEvent,
    CalendarResourceConfig,
    CalendarStyle
} from "../../types.js";
import {
    createMultiDayEventDrop,
    createMultiDayEventPreview,
    createMultiDayEventResize,
    getMultiDayPointerColumnIndex,
    getMultiDayResizeOffset
} from "./layout/multiDayEvents.js";
import type { MultiDayEventLayout as Layout } from "./layout/multiDayEvents.js";
import type { LayoutColumn } from "./layout/types.js";
import { createEventPresentation } from "./rendering.js";
import type { EventRendering } from "./rendering.js";
import { resolveCalendarResourceTitle } from "./resources.js";
import type { MultiDayInteractions } from "./interactions.js";

interface MultiDayEventsProps<
    Event extends CalendarEvent,
    Resource
> {
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
    layout: dedicatedLayout,
    columns,
    resources,
    rendering,
    interactions,
    gridRef: multiDayGridRef
}: MultiDayEventsProps<Event, Resource>) {
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
        move: multiDayEventMove,
        resize: multiDayEventResize,
        beginMove: beginMultiDayEventMove,
        updateMoveTarget: updateMultiDayEventMoveTarget,
        cancelMove: cancelMultiDayEventMove,
        commitMove: commitMultiDayEventMove,
        handleMovePointerMove: handleMultiDayMovePointerMove,
        handleMovePointerUp: handleMultiDayMovePointerUp,
        handleMovePointerCancel: handleMultiDayMovePointerCancel,
        beginResize: beginMultiDayEventResize,
        updateResize: updateMultiDayEventResize,
        cancelResize: cancelMultiDayEventResize,
        commitResize: commitMultiDayEventResize,
        handleResizePointerMove: handleMultiDayResizePointerMove,
        handleResizePointerUp: handleMultiDayResizePointerUp,
        handleResizePointerCancel: handleMultiDayResizePointerCancel
    } = interactions;
    const multiDayMovePreview = useMemo(() => {
        if (!multiDayEventMove?.target) return null;

        const change = createMultiDayEventDrop(
            multiDayEventMove.segment,
            multiDayEventMove.target
        );
        const resourceTitle = multiDayEventMove.target.resource == null
            || multiDayEventMove.target.resourceId == null
            ? null
            : resolveCalendarResourceTitle(
                resources,
                multiDayEventMove.target.resource,
                multiDayEventMove.target.resourceId
            );
        const resource = typeof resourceTitle === "string"
            || typeof resourceTitle === "number"
            ? String(resourceTitle)
            : multiDayEventMove.target.resourceId == null
                ? undefined
                : String(multiDayEventMove.target.resourceId);

        return {
            announcement: messages.eventMoveTarget({
                view: viewName,
                title: multiDayEventMove.segment.event.title,
                date: formatters.date(change.start, formatContext),
                time: formatters.time(change.start, formatContext),
                resource
            }),
            color: multiDayEventMove.segment.event.color,
            laneIndex: multiDayEventMove.segment.laneIndex,
            segments: createMultiDayEventPreview({
                event: multiDayEventMove.segment.event,
                start: change.start,
                end: change.end,
                resourceId: change.destination.resourceId,
                columns
            })
        };
    }, [
        columns,
        formatContext,
        formatters,
        messages,
        multiDayEventMove,
        resources,
        viewName
    ]);
    const multiDayResizePreview = useMemo(() => {
        if (multiDayEventResize?.targetOffset == null) return null;

        const change = createMultiDayEventResize({
            event: multiDayEventResize.segment.event,
            edge: multiDayEventResize.edge,
            dayOffset: multiDayEventResize.targetOffset,
            source: multiDayEventResize.source
        });

        return {
            color: multiDayEventResize.segment.event.color,
            laneIndex: multiDayEventResize.segment.laneIndex,
            segments: createMultiDayEventPreview({
                event: multiDayEventResize.segment.event,
                start: change.start,
                end: change.end,
                resourceId: multiDayEventResize.source.resourceId,
                columns
            })
        };
    }, [columns, multiDayEventResize]);

    if (dedicatedLayout.events.length === 0) return null;

    return (
        <section
            className="time-grid-view_multi-day-region"
            aria-label={messages.multiDayRegionLabel({ view: viewName })}
        >
            <div
                role="status"
                aria-atomic="true"
                className="time-grid-view_live-region"
            >
                {multiDayMovePreview?.announcement}
            </div>
            <div
                className="time-grid-view_multi-day-label"
                aria-hidden="true"
            >
                {messages.multiDayRegionLabel({ view: viewName })}
            </div>
            <div
                ref={multiDayGridRef}
                className="time-grid-view_multi-day-grid"
                style={{
                    gridTemplateRows: `repeat(${dedicatedLayout.laneCount}, minmax(30px, auto))`
                }}
            >
                {columns.map((column, columnIndex) => (
                    <div
                        key={`${column.key}-multi-day-column`}
                        aria-hidden="true"
                        className="time-grid-view_multi-day-column"
                        style={{
                            gridColumn: columnIndex + 1,
                            gridRow: `1 / ${dedicatedLayout.laneCount + 1}`
                        }}
                    />
                ))}
                {multiDayMovePreview?.segments.map((segment) => (
                    <div
                        key={`${segment.columnIndex}-${segment.columnSpan}`}
                        aria-hidden="true"
                        className="time-grid-view_move-preview is-multi-day"
                        style={{
                            "--color": multiDayMovePreview.color,
                            gridColumn: `${segment.columnIndex + 1} / span ${segment.columnSpan}`,
                            gridRow: multiDayMovePreview.laneIndex + 1
                        } as CalendarStyle}
                    />
                ))}
                {multiDayResizePreview?.segments.map((segment) => (
                    <div
                        key={`${segment.columnIndex}-${segment.columnSpan}`}
                        aria-hidden="true"
                        className="time-grid-view_resize-preview is-multi-day"
                        style={{
                            "--color": multiDayResizePreview.color,
                            gridColumn: `${segment.columnIndex + 1} / span ${segment.columnSpan}`,
                            gridRow: multiDayResizePreview.laneIndex + 1
                        } as CalendarStyle}
                    />
                ))}
                {dedicatedLayout.events.map((segment) => {
                    const { event } = segment;
                    const presentation = createEventPresentation({
                        event,
                        segment,
                        layout: "dedicated",
                        rendering
                    });
                    const {
                        segment: rendererSegment,
                        selected,
                        movable,
                        interactionProps,
                        ariaLabel
                    } = presentation;
                    const eventKey = `${event.id ?? event.title ?? "event"}-${event.start.getTime()}-${event.end.getTime()}-${segment.columnIndex}-multi-day`;
                    const moveHandleKey = `${eventKey}-move`;
                    const activeMove = multiDayEventMove?.handleKey === moveHandleKey
                        ? multiDayEventMove
                        : null;
                    const eventStyle: CalendarStyle = {
                        "--color": event.color,
                        gridColumn: `${segment.columnIndex + 1} / span ${segment.columnSpan}`,
                        gridRow: segment.laneIndex + 1,
                        overflow: "hidden"
                    };

                    const handleMoveKeyDown = (
                        interaction: KeyboardEvent<HTMLElement>
                    ) => {
                        interaction.stopPropagation();
                        const current = multiDayEventMove?.handleKey
                            === moveHandleKey
                            ? multiDayEventMove
                            : null;

                        if (interaction.key === "Escape" && current) {
                            interaction.preventDefault();
                            cancelMultiDayEventMove();
                            return;
                        }
                        if (interaction.key === "Enter" && current) {
                            interaction.preventDefault();
                            commitMultiDayEventMove(current);
                            return;
                        }
                        if (
                            interaction.key !== "ArrowLeft"
                            && interaction.key !== "ArrowRight"
                        ) return;

                        interaction.preventDefault();
                        const nextState = current ?? beginMultiDayEventMove(
                            segment,
                            moveHandleKey
                        );
                        if (!nextState) return;
                        const currentColumn = nextState.target
                            ?? nextState.origin;
                        const currentIndex = columns.indexOf(currentColumn);
                        const target = columns[
                            currentIndex + (interaction.key === "ArrowLeft" ? -1 : 1)
                        ];
                        if (target) {
                            updateMultiDayEventMoveTarget(nextState, target);
                        }
                    };

                    const handleMovePointerDown = (
                        interaction: PointerEvent<HTMLElement>
                    ) => {
                        interaction.preventDefault();
                        interaction.stopPropagation();
                        const grid = multiDayGridRef.current;
                        if (!grid) return;
                        const bounds = grid.getBoundingClientRect();
                        const grabColumnIndex = getMultiDayPointerColumnIndex(
                            interaction.clientX,
                            bounds.left,
                            bounds.width,
                            columns.length
                        );
                        if (grabColumnIndex == null) return;
                        const next = beginMultiDayEventMove(
                            segment,
                            moveHandleKey,
                            interaction.pointerId,
                            grabColumnIndex
                        );
                        if (
                            next
                            && interaction.nativeEvent.isTrusted
                        ) {
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
                                    className: "time-grid-view_event time-grid-view_multi-day-event",
                                    ...interactionProps,
                                    "aria-label": ariaLabel,
                                    style: {
                                        ...eventStyle,
                                        ...event.style
                                    }
                                }}
                            />
                            {movable && (
                                <div
                                    className="time-grid-view_event-move-controls"
                                    style={eventStyle}
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
                                        aria-keyshortcuts="ArrowLeft ArrowRight Enter Escape"
                                        onBlur={() => {
                                            if (
                                                multiDayEventMove?.handleKey
                                                === moveHandleKey
                                            ) {
                                                commitMultiDayEventMove(
                                                    multiDayEventMove
                                                );
                                            }
                                        }}
                                        onKeyDown={handleMoveKeyDown}
                                        onPointerDown={handleMovePointerDown}
                                        onPointerMove={handleMultiDayMovePointerMove}
                                        onPointerUp={handleMultiDayMovePointerUp}
                                        onPointerCancel={handleMultiDayMovePointerCancel}
                                    >
                                        <span aria-hidden="true">↔</span>
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

                                const source = {
                                    day: segment.day,
                                    resource: segment.resource,
                                    resourceId: segment.resourceId
                                };
                                const dayOffsets = [...new Set(columns
                                    .filter((column) => (
                                        column.resourceId === segment.resourceId
                                    ))
                                    .map((column) => getMultiDayResizeOffset(
                                        event,
                                        edge,
                                        column.day
                                    ))
                                    .filter((dayOffset) => {
                                        const change = createMultiDayEventResize({
                                            event,
                                            edge,
                                            dayOffset,
                                            source
                                        });
                                        return change.end > change.start;
                                    }))].sort((first, second) => first - second);
                                if (dayOffsets.length === 0) return null;

                                const handleKey = `${eventKey}-${edge}`;
                                const activeResize = multiDayEventResize?.handleKey
                                    === handleKey
                                    ? multiDayEventResize
                                    : null;
                                const currentOffset = activeResize?.targetOffset ?? 0;
                                const currentChange = createMultiDayEventResize({
                                    event,
                                    edge,
                                    dayOffset: currentOffset,
                                    source
                                });
                                const currentBoundary = currentChange[edge];
                                const boundaries = dayOffsets.map((dayOffset) => (
                                    createMultiDayEventResize({
                                        event,
                                        edge,
                                        dayOffset,
                                        source
                                    })[edge]
                                ));
                                const firstBoundary = boundaries[0];
                                const lastBoundary = boundaries.at(-1);
                                if (!firstBoundary || !lastBoundary) return null;

                                const handleKeyDown = (
                                    interaction: KeyboardEvent<HTMLElement>
                                ) => {
                                    interaction.stopPropagation();
                                    const current = multiDayEventResize?.handleKey
                                        === handleKey
                                        ? multiDayEventResize
                                        : null;

                                    if (interaction.key === "Escape" && current) {
                                        interaction.preventDefault();
                                        cancelMultiDayEventResize();
                                        return;
                                    }
                                    if (interaction.key === "Enter" && current) {
                                        interaction.preventDefault();
                                        commitMultiDayEventResize(current);
                                        return;
                                    }
                                    if (
                                        interaction.key !== "ArrowLeft"
                                        && interaction.key !== "ArrowRight"
                                    ) return;

                                    interaction.preventDefault();
                                    const nextState = current
                                        ?? beginMultiDayEventResize(
                                            segment,
                                            edge,
                                            handleKey,
                                            dayOffsets
                                        );
                                    if (!nextState) return;
                                    const offset = nextState.targetOffset ?? 0;
                                    const nextOffset = interaction.key
                                        === "ArrowLeft"
                                        ? [...nextState.dayOffsets]
                                            .reverse()
                                            .find((value) => value < offset)
                                        : nextState.dayOffsets
                                            .find((value) => value > offset);
                                    if (nextOffset == null) return;
                                    updateMultiDayEventResize({
                                        ...nextState,
                                        targetOffset: nextOffset === 0
                                            ? undefined
                                            : nextOffset
                                    });
                                };

                                const handlePointerDown = (
                                    interaction: PointerEvent<HTMLElement>
                                ) => {
                                    interaction.preventDefault();
                                    interaction.stopPropagation();
                                    const next = beginMultiDayEventResize(
                                        segment,
                                        edge,
                                        handleKey,
                                        dayOffsets,
                                        interaction.pointerId
                                    );
                                    if (
                                        next
                                        && interaction.nativeEvent.isTrusted
                                    ) {
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
                                        className={`time-grid-view_multi-day-resize-handle is-${edge}`}
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
                                        aria-orientation="horizontal"
                                        aria-valuemin={firstBoundary.getTime()}
                                        aria-valuemax={lastBoundary.getTime()}
                                        aria-valuenow={currentBoundary.getTime()}
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
                                            if (
                                                multiDayEventResize?.handleKey
                                                === handleKey
                                            ) {
                                                commitMultiDayEventResize(
                                                    multiDayEventResize
                                                );
                                            }
                                        }}
                                        onKeyDown={handleKeyDown}
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handleMultiDayResizePointerMove}
                                        onPointerUp={handleMultiDayResizePointerUp}
                                        onPointerCancel={handleMultiDayResizePointerCancel}
                                        style={{
                                            color: event.color,
                                            gridColumn: `${segment.columnIndex + 1} / span ${segment.columnSpan}`,
                                            gridRow: segment.laneIndex + 1,
                                            justifySelf: edge === "start"
                                                ? "start"
                                                : "end"
                                        }}
                                    />
                                );
                            })}
                        </Fragment>
                    );
                })}
            </div>
        </section>
    );
}
