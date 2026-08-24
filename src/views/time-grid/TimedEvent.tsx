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
import {
    appendMoveShortcuts,
    handleMoveSurfaceClick,
    handleMoveSurfaceKeyDown,
    handleMoveSurfacePointerCancel,
    handleMoveSurfacePointerUp
} from "./interactions/moveSurface.js";
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

const MOVE_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

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
    const handleKey = `${eventKey}-${edge}`;
    const active = interactions.resize?.handleKey === handleKey
        ? interactions.resize
        : null;
    const currentBoundary = active?.target?.date ?? event[edge];
    const boundaryVisible = currentBoundary.getTime() === segment[edge].getTime();
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

    const currentValue = currentBoundary.getTime();
    const minimumValue = Math.min(firstBoundary.date.getTime(), currentValue);
    const maximumValue = Math.max(lastBoundary.date.getTime(), currentValue);
    const { formatters, messages, context } = rendering.text;
    const boundaryDate = formatters.date(currentBoundary, context);
    const boundaryTime = formatters.time(currentBoundary, context);
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
            className={`time-grid-view_event-resize-handle is-${edge}${active
                ? " is-active"
                : ""}`}
            data-event-id={event.id}
            data-resize-edge={edge}
            aria-label={messages.eventResizeHandle({
                view: context.view,
                edge,
                title: event.title,
                date: boundaryDate,
                time: boundaryTime
            })}
            aria-orientation="vertical"
            aria-valuemin={minimumValue}
            aria-valuemax={maximumValue}
            aria-valuenow={currentValue}
            aria-valuetext={messages.slotLabel({
                view: context.view,
                date: boundaryDate,
                time: boundaryTime
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
        >
            <span
                aria-hidden="true"
                className="time-grid-view_resize-value"
            >
                {boundaryTime}
            </span>
        </div>
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
    const moveHandleKey = `${occurrenceKey}-move`;
    const moving = interactions.move?.handleKey === moveHandleKey;
    const resizing = interactions.resize?.handleKey.startsWith(
        `${occurrenceKey}-`
    ) ?? false;
    const moveOptions = {
        segment,
        handleKey: moveHandleKey,
        slots,
        interactions
    };
    const controls = {
        segment,
        rendererSegment: model.segment,
        eventKey: occurrenceKey,
        rendering,
        interactions
    };

    return (
        <div className="time-grid-view_event-region">
            <EventRenderer
                event={event}
                segment={model.segment}
                selected={model.selected}
                elementProps={{
                    className: `time-grid-view_event${model.movable
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
                            "ArrowUp ArrowDown ArrowLeft ArrowRight Enter Escape"
                        )
                        : model.interactionProps["aria-keyshortcuts"],
                    title: model.details,
                    onBlur: model.movable
                        ? () => handleTimedMoveBlur(
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
                            (moveInteraction) => handleTimedMoveKeyDown(
                                moveInteraction,
                                moveOptions
                            ),
                            model.interactionProps.onKeyDown
                        )
                        : model.interactionProps.onKeyDown,
                    onPointerDown: model.movable
                        ? (interaction) => handleTimedMovePointerDown(
                            interaction,
                            segment,
                            moveHandleKey,
                            interactions
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
        </div>
    );
}
