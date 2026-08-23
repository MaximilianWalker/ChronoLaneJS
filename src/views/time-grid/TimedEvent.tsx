import type {
    CalendarEvent,
    CalendarStyle
} from "../../types.js";
import { createEventModel } from "./eventModel.js";
import type { EventRendering } from "./eventModel.js";
import {
    handleTimedMoveBlur,
    handleTimedMoveKeyDown,
    handleTimedMovePointerDown,
    handleTimedResizeBlur,
    handleTimedResizeKeyDown,
    handleTimedResizePointerDown
} from "./interactions/timedControls.js";
import type { TimedInteractions } from "./interactions/types.js";
import type {
    LayoutEvent,
    LayoutSlot
} from "./layout/types.js";
import { createResizeBoundaries } from "./resize.js";
import type { ResizeInterval } from "./resize.js";
import type {
    EventResizeEdge,
    EventSegment
} from "./types.js";

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

interface ControlProps<Event extends CalendarEvent, Resource> {
    segment: LayoutEvent<Event, Resource>;
    rendererSegment: EventSegment<Resource>;
    eventKey: string;
    rendering: EventRendering<Event, Resource>;
    interactions: TimedInteractions<Event, Resource>;
}

interface MoveControlProps<Event extends CalendarEvent, Resource>
    extends ControlProps<Event, Resource> {
    slots: LayoutSlot<Resource>[];
}

function MoveControl<Event extends CalendarEvent, Resource>({
    segment,
    eventKey,
    slots,
    rendering,
    interactions
}: MoveControlProps<Event, Resource>) {
    const { event } = segment;
    const handleKey = `${eventKey}-move`;
    const active = interactions.move?.handleKey === handleKey;
    const moveOptions = { segment, handleKey, slots, interactions };

    return (
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
                data-moving={active || undefined}
                aria-label={rendering.text.messages.eventMoveHandle({
                    view: rendering.text.context.view,
                    title: event.title
                })}
                aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter Escape"
                onBlur={() => handleTimedMoveBlur(handleKey, interactions)}
                onKeyDown={(interaction) => (
                    handleTimedMoveKeyDown(interaction, moveOptions)
                )}
                onPointerDown={(interaction) => (
                    handleTimedMovePointerDown(
                        interaction,
                        segment,
                        handleKey,
                        interactions
                    )
                )}
                onPointerMove={interactions.handleMovePointerMove}
                onPointerUp={interactions.handleMovePointerUp}
                onPointerCancel={interactions.handleMovePointerCancel}
            >
                <span aria-hidden="true">↕</span>
            </button>
        </div>
    );
}

interface ResizeControlProps<Event extends CalendarEvent, Resource>
    extends ControlProps<Event, Resource> {
    edge: EventResizeEdge;
    resizeIntervals: ResizeInterval<Resource>[];
}

function ResizeControl<Event extends CalendarEvent, Resource>({
    segment,
    rendererSegment,
    eventKey,
    edge,
    resizeIntervals,
    rendering,
    interactions
}: ResizeControlProps<Event, Resource>) {
    const { event } = segment;
    const boundaryVisible = event[edge].getTime() === segment[edge].getTime();
    const allowed = boundaryVisible
        && (rendering.canResize?.(event, rendererSegment, edge) ?? true);
    if (!allowed) return null;

    const boundaries = createResizeBoundaries({
        event,
        edge,
        resourceId: segment.resourceId,
        intervals: resizeIntervals
    });
    const firstBoundary = boundaries[0];
    const lastBoundary = boundaries.at(-1);
    if (!firstBoundary || !lastBoundary) return null;

    const handleKey = `${eventKey}-${edge}`;
    const active = interactions.resize?.handleKey === handleKey
        ? interactions.resize
        : null;
    const currentBoundary = active?.target?.date ?? event[edge];
    const currentValue = currentBoundary.getTime();
    const minimumValue = Math.min(firstBoundary.date.getTime(), currentValue);
    const maximumValue = Math.max(lastBoundary.date.getTime(), currentValue);
    const { formatters, messages, context } = rendering.text;
    const resizeOptions = {
        event,
        segment,
        edge,
        handleKey,
        boundaries,
        interactions
    };

    return (
        <div
            role="slider"
            tabIndex={0}
            className={`time-grid-view_event-resize-handle is-${edge}`}
            data-event-id={event.id}
            data-resize-edge={edge}
            aria-label={messages.eventResizeHandle({
                view: context.view,
                edge,
                title: event.title,
                date: formatters.date(currentBoundary, context),
                time: formatters.time(currentBoundary, context)
            })}
            aria-orientation="vertical"
            aria-valuemin={minimumValue}
            aria-valuemax={maximumValue}
            aria-valuenow={currentValue}
            aria-valuetext={messages.slotLabel({
                view: context.view,
                date: formatters.date(currentBoundary, context),
                time: formatters.time(currentBoundary, context)
            })}
            onBlur={() => handleTimedResizeBlur(handleKey, interactions)}
            onKeyDown={(interaction) => (
                handleTimedResizeKeyDown(interaction, resizeOptions)
            )}
            onPointerDown={(interaction) => (
                handleTimedResizePointerDown(interaction, resizeOptions)
            )}
            onPointerMove={interactions.handleResizePointerMove}
            onPointerUp={interactions.handleResizePointerUp}
            onPointerCancel={interactions.handleResizePointerCancel}
            style={{
                color: event.color,
                gridColumn: "1 / 2",
                gridRow: `${segment.startRow} / ${segment.endRow}`,
                alignSelf: edge === "start" ? "start" : "end",
                ...getLaneStyle(segment)
            }}
        />
    );
}

interface TimedEventProps<Event extends CalendarEvent, Resource> {
    occurrenceKey: string;
    segment: LayoutEvent<Event, Resource>;
    slots: LayoutSlot<Resource>[];
    resizeIntervals: ResizeInterval<Resource>[];
    rendering: EventRendering<Event, Resource>;
    interactions: TimedInteractions<Event, Resource>;
}

export default function TimedEvent<
    Event extends CalendarEvent,
    Resource
>({
    occurrenceKey,
    segment,
    slots,
    resizeIntervals,
    rendering,
    interactions
}: TimedEventProps<Event, Resource>) {
    const { event } = segment;
    const model = createEventModel({ event, segment, rendering });
    const EventRenderer = rendering.eventRenderer;
    const controls = {
        segment,
        rendererSegment: model.segment,
        eventKey: occurrenceKey,
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
                    className: "time-grid-view_event",
                    ...model.interactionProps,
                    "aria-label": model.ariaLabel,
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
            {model.movable && <MoveControl {...controls} slots={slots} />}
            {rendering.resizeEnabled && (
                <>
                    <ResizeControl
                        {...controls}
                        edge="start"
                        resizeIntervals={resizeIntervals}
                    />
                    <ResizeControl
                        {...controls}
                        edge="end"
                        resizeIntervals={resizeIntervals}
                    />
                </>
            )}
        </>
    );
}
