"use client";

import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import type {
    DragEvent,
    KeyboardEvent,
    PointerEvent,
    SyntheticEvent
} from "react";
import { format } from "date-fns/format";

import CalendarNavigation from "../../components/CalendarNavigation.js";
import { createEventInteractionProps } from "../../components/eventInteraction.js";
import { normalizeEvents } from "../../core/events.js";
import {
    DEFAULT_CALENDAR_LOCALE,
    readCalendarLocale,
    resolveCalendarWeekStart
} from "../../core/locale.js";
import {
    defaultCalendarFormatters,
    defaultCalendarMessages
} from "../../core/localization.js";
import { resolveCalendarRange } from "../../core/range.js";
import {
    getCalendarNavigationState,
    normalizeCalendarNavigationBoundaries,
    resolveCalendarNavigationDate
} from "../../core/navigation.js";
import { normalizeCalendarSelectionRange } from "../../core/selection.js";
import { useCalendarViewDate } from "../../hooks/useViewDate.js";
import type {
    CalendarEvent,
    CalendarStyle,
    NormalizedCalendarEvent
} from "../../types.js";
import Background from "./Background.js";
import {
    toTimeGridEventSegment,
    toTimeGridSlot
} from "./contracts.js";
import DayHeader from "./DayHeader.js";
import { createEventDrop } from "./drop.js";
import Event from "./Event.js";
import { createLayout } from "./layout/createLayout.js";
import { createTimeGridHeaderRows } from "./layout/headers.js";
import type { LayoutEvent, LayoutSlot } from "./layout/types.js";
import {
    createEventResize,
    createTimeGridResizeBoundaries,
    findAdjacentResizeBoundary,
    findClosestResizeBoundary
} from "./resize.js";
import type { TimeGridResizeBoundary } from "./resize.js";
import ResourceHeader from "./ResourceHeader.js";
import { resolveCalendarResourceTitle } from "./resources.js";
import { resolveSlotDimension } from "./sizing.js";
import Slot from "./Slot.js";
import type {
    TimeGridEventPosition,
    TimeGridEventResizeEdge,
    TimeGridViewProps
} from "./types.js";

const EMPTY_ITEMS: never[] = [];
const EMPTY_COMPONENTS = /* @__PURE__ */ Object.freeze({});
const DEFAULT_SLOT_HEIGHT = 50;

interface EventResizeState<
    Event extends CalendarEvent,
    Resource
> {
    event: NormalizedCalendarEvent<Event>;
    edge: TimeGridEventResizeEdge;
    source: TimeGridEventPosition<Resource>;
    boundaries: TimeGridResizeBoundary<Resource>[];
    handleKey: string;
    pointerId?: number;
    target?: TimeGridResizeBoundary<Resource>;
}

/** Rounds percentages to stable CSS values without visible precision noise. */
const percentage = (value: number): number => Number(value.toFixed(6));

/** Calculates the width and horizontal offset of one overlapping event lane. */
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

/** Places a resize preview line around one grid boundary row. */
const getResizePreviewRows = (row: number, totalMinutes: number): string => {
    if (row <= 1) return "1 / 2";
    if (row >= totalMinutes + 1) return `${totalMinutes} / ${totalMinutes + 1}`;
    return `${Math.floor(row)} / ${Math.floor(row) + 1}`;
};

/** Groups positioned items by column for direct rendering lookups. */
const groupByColumn = <Item extends { columnIndex: number }>(
    items: Item[],
    columnCount: number
): Item[][] => {
    const groups = Array.from({ length: columnCount }, () => [] as Item[]);
    items.forEach((item) => groups[item.columnIndex]?.push(item));
    return groups;
};

/**
 * Renders a configurable time grid across arbitrary days and resource columns.
 *
 * @remarks
 * The view owns range navigation, time-zone normalization, slot generation,
 * event clipping, overlap lanes, drag/drop, and slot-snapped resizing. Markup
 * for slots, events, background events, and hierarchical headers can be
 * replaced through `components` without replacing layout behavior.
 */
export default function TimeGridView<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
>({
    className,
    style,
    events = EMPTY_ITEMS,
    backgroundEvents = EMPTY_ITEMS,
    resources,
    groupBy = "day",
    date: controlledDate,
    defaultDate,
    range = "week",
    weekStart: weekStartProp,
    minDate = null,
    maxDate = null,
    minTime = "00:00",
    maxTime = "24:00",
    showControls = true,
    slotDuration = 60,
    labelInterval = slotDuration,
    slotSizing,
    locale = DEFAULT_CALENDAR_LOCALE,
    formatters = defaultCalendarFormatters,
    messages = defaultCalendarMessages,
    viewName = "time-grid",
    timeZone,
    selectedRange,
    selectedEventIds = EMPTY_ITEMS,
    canDragEvent,
    canResizeEvent,
    canSelectEvent,
    canOpenEvent,
    onDateChange,
    onRangeChange,
    onEventSelect,
    onEventOpen,
    onEventDrop,
    onEventResize,
    onSlotSelect,
    eventInteractions,
    components = EMPTY_COMPONENTS
}: TimeGridViewProps<Event, Resource>) {
    const {
        slot: SlotComponent = Slot,
        event: EventComponent = Event,
        backgroundEvent: BackgroundEventComponent = Background,
        dayHeader: DayHeaderComponent = DayHeader,
        resourceHeader: ResourceHeaderComponent = ResourceHeader,
        navigation: NavigationComponent
    } = components;
    const [draggedEvent, setDraggedEvent] = useState<
        LayoutEvent<Event, Resource> | null
    >(null);
    const [eventResize, setEventResize] = useState<
        EventResizeState<Event, Resource> | null
    >(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const calendarLocale = readCalendarLocale(locale);
    const weekStart = resolveCalendarWeekStart(calendarLocale, weekStartProp);
    const { anchorDate, setDate } = useCalendarViewDate({
        date: controlledDate,
        defaultDate,
        timeZone,
        onDateChange
    });
    const resolvedRange = useMemo(() => resolveCalendarRange(range, anchorDate, {
        weekStartsOn: weekStart
    }), [anchorDate, range, weekStart]);
    const { days, start: rangeStart, end: rangeEnd } = resolvedRange;
    const navigationBoundaries = useMemo(
        () => normalizeCalendarNavigationBoundaries(minDate, maxDate, timeZone),
        [maxDate, minDate, timeZone]
    );
    const calendarEvents = useMemo(
        () => normalizeEvents(events, timeZone),
        [events, timeZone]
    );
    const calendarBackgroundEvents = useMemo(
        () => normalizeEvents(backgroundEvents, timeZone),
        [backgroundEvents, timeZone]
    );
    const calendarSelectedRange = useMemo(
        () => selectedRange == null
            ? null
            : normalizeCalendarSelectionRange(selectedRange, timeZone),
        [selectedRange, timeZone]
    );
    const layout = useMemo(() => createLayout({
        days,
        events: calendarEvents,
        backgroundEvents: calendarBackgroundEvents,
        resources,
        groupBy,
        minTime,
        maxTime,
        slotDuration,
        labelInterval
    }), [
        calendarBackgroundEvents,
        calendarEvents,
        days,
        groupBy,
        labelInterval,
        maxTime,
        minTime,
        resources,
        slotDuration
    ]);
    const {
        columns,
        slots,
        dividers,
        events: positionedEvents,
        backgroundEvents: positionedBackgroundEvents,
        totalMinutes
    } = layout;
    const eventsByColumn = useMemo(
        () => groupByColumn(positionedEvents, columns.length),
        [columns.length, positionedEvents]
    );
    const backgroundEventsByColumn = useMemo(
        () => groupByColumn(positionedBackgroundEvents, columns.length),
        [columns.length, positionedBackgroundEvents]
    );
    const headerRows = useMemo(
        () => createTimeGridHeaderRows(columns, groupBy),
        [columns, groupBy]
    );
    const hasResourceHeaders = headerRows.secondary.length > 0;
    const slotWidth = resolveSlotDimension(
        slotSizing,
        "width"
    );
    const slotHeight = resolveSlotDimension(
        slotSizing,
        "height",
        DEFAULT_SLOT_HEIGHT
    );
    const slotCount = totalMinutes / slotDuration;
    const fixedSlotWidth = slotWidth.size;
    const fixedSlotHeight = slotHeight.size;
    const slotWidthValue = fixedSlotWidth !== undefined
        ? `${fixedSlotWidth}px`
        : `minmax(${slotWidth.minSize}px, 1fr)`;
    const gridHeight = fixedSlotHeight !== undefined
        ? `${slotCount * fixedSlotHeight}px`
        : undefined;
    const gridMinHeight = fixedSlotHeight === undefined && slotHeight.minSize > 0
        ? `${slotCount * slotHeight.minSize}px`
        : undefined;
    const gridRows = `repeat(${totalMinutes}, minmax(0, 1fr))`;
    const gridWrapperStyle: CalendarStyle = {
        "--_time-grid-header-row-count": hasResourceHeaders ? 2 : 1,
        "--_time-grid-slot-columns": `repeat(${columns.length}, ${slotWidthValue})`
    };

    const calendarRange = { start: rangeStart, end: rangeEnd, days };
    const formatContext = { locale: calendarLocale, view: viewName };
    const navigationContext = { view: viewName, range: calendarRange };
    const header = formatters.rangeHeader(calendarRange, formatContext);
    const navigationState = getCalendarNavigationState({
        anchorDate,
        periodStart: rangeStart,
        periodEnd: rangeEnd,
        ...navigationBoundaries
    });
    const canDropEvents = onEventDrop != null;
    const canResizeEvents = onEventResize != null;

    const updateEventResize = useCallback((
        next: EventResizeState<Event, Resource> | null
    ) => {
        setEventResize(next);
    }, []);

    const cancelEventResize = useCallback(() => {
        updateEventResize(null);
    }, [updateEventResize]);

    const commitEventResize = useCallback((
        current: EventResizeState<Event, Resource> | null
    ) => {
        updateEventResize(null);
        if (!current?.target || !onEventResize) return;

        const originalBoundary = current.edge === "start"
            ? current.event.start
            : current.event.end;
        if (current.target.date.getTime() === originalBoundary.getTime()) return;

        onEventResize(createEventResize(
            current.event,
            current.edge,
            current.target,
            current.source
        ));
    }, [onEventResize, updateEventResize]);

    const beginEventResize = useCallback((
        event: NormalizedCalendarEvent<Event>,
        segment: LayoutEvent<Event, Resource>,
        edge: TimeGridEventResizeEdge,
        handleKey: string,
        pointerId?: number
    ): EventResizeState<Event, Resource> | null => {
        const boundaries = createTimeGridResizeBoundaries({
            event,
            edge,
            resourceId: segment.resourceId,
            slots,
            slotDuration
        });
        if (boundaries.length === 0) return null;

        const next = {
            event,
            edge,
            source: {
                day: segment.day,
                resource: segment.resource,
                resourceId: segment.resourceId
            },
            boundaries,
            handleKey,
            pointerId
        } satisfies EventResizeState<Event, Resource>;
        updateEventResize(next);
        return next;
    }, [slotDuration, slots, updateEventResize]);

    const handleResizePointerMove = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const current = eventResize;
        const grid = gridRef.current;
        if (
            !current
            || current.pointerId !== interaction.pointerId
            || !grid
            || columns.length === 0
        ) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        const bounds = grid.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) return;

        const rawColumnIndex = Math.min(
            columns.length - 1,
            Math.max(0, Math.floor(
                (interaction.clientX - bounds.left) / bounds.width * columns.length
            ))
        );
        const pointerColumn = columns[rawColumnIndex];
        if (!pointerColumn) return;

        const targetColumnIndex = columns.findIndex((column) => (
            column.dayIndex === pointerColumn.dayIndex
            && column.resourceId === current.source.resourceId
        ));
        if (targetColumnIndex === -1) return;

        const row = 1 + Math.min(
            totalMinutes,
            Math.max(0, (interaction.clientY - bounds.top) / bounds.height * totalMinutes)
        );
        const target = findClosestResizeBoundary(
            current.boundaries,
            targetColumnIndex,
            row,
            current.edge
        );
        if (!target || current.target === target) return;

        updateEventResize({ ...current, target });
    }, [columns, eventResize, totalMinutes, updateEventResize]);

    const handleResizePointerUp = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const current = eventResize;
        if (!current || current.pointerId !== interaction.pointerId) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        if (interaction.currentTarget.hasPointerCapture(interaction.pointerId)) {
            interaction.currentTarget.releasePointerCapture(interaction.pointerId);
        }
        commitEventResize(current);
    }, [commitEventResize, eventResize]);

    const handleResizePointerCancel = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const current = eventResize;
        if (!current || current.pointerId !== interaction.pointerId) return;

        interaction.stopPropagation();
        cancelEventResize();
    }, [cancelEventResize, eventResize]);

    const navigate = useCallback((direction: -1 | 1) => {
        const nextDate = resolvedRange.navigate(direction);
        setDate(resolveCalendarNavigationDate(
            anchorDate,
            nextDate,
            navigationBoundaries,
            timeZone
        ));
    }, [
        anchorDate,
        navigationBoundaries,
        resolvedRange,
        setDate,
        timeZone
    ]);

    useEffect(() => {
        onRangeChange?.({ start: rangeStart, end: rangeEnd, days });
    }, [days, onRangeChange, rangeEnd, rangeStart]);

    const handleDrop = useCallback((
        interaction: DragEvent<HTMLElement>,
        slot: LayoutSlot<Resource>
    ) => {
        interaction.preventDefault();
        if (!draggedEvent || !onEventDrop) return;

        onEventDrop(createEventDrop(draggedEvent, slot));
        setDraggedEvent(null);
    }, [draggedEvent, onEventDrop]);

    return (
        <div
            className={`time-grid-view${fixedSlotWidth !== undefined
                ? " has-fixed-slot-width"
                : ""}${fixedSlotHeight !== undefined
                ? " has-fixed-slot-height"
                : ""} ${className ?? ""}`.trim()}
            data-time-zone={timeZone}
            style={style}
        >
            {showControls && (
                <CalendarNavigation
                    className="time-grid-view_navigation"
                    header={header}
                    onPrevious={() => navigate(-1)}
                    onNext={() => navigate(1)}
                    previousDisabled={navigationState.previousDisabled}
                    nextDisabled={navigationState.nextDisabled}
                    previousLabel={messages.previous(navigationContext)}
                    nextLabel={messages.next(navigationContext)}
                    navigation={NavigationComponent}
                />
            )}
            <div
                className="time-grid-view_grid-wrapper calendar-scroll-region"
                aria-label={messages.timeGridLabel({ view: viewName })}
                data-group-by={hasResourceHeaders ? groupBy : undefined}
                style={gridWrapperStyle}
                tabIndex={0}
            >
                <div
                    className={`time-grid-view_header${hasResourceHeaders
                        ? " has-resource-headers"
                        : ""}`}
                >
                    {[headerRows.primary, headerRows.secondary].map(
                        (headers, rowIndex) => headers.map((headerCell) => (
                            <div
                                key={`${rowIndex}-${headerCell.key}`}
                                className={`time-grid-view_header-cell time-grid-view_${headerCell.kind}-header is-${rowIndex === 0
                                    ? "primary"
                                    : "secondary"}`}
                                style={{
                                    gridColumn: `${headerCell.columnIndex + 2} / span ${headerCell.columns.length}`,
                                    gridRow: rowIndex + 1
                                }}
                            >
                                {headerCell.kind === "day"
                                    ? (
                                        <DayHeaderComponent
                                            day={headerCell.day}
                                            columns={headerCell.columns}
                                            title={formatters.dayHeader(
                                                headerCell.day,
                                                formatContext
                                            )}
                                        />
                                    )
                                    : (
                                        <ResourceHeaderComponent
                                            resource={headerCell.resource}
                                            resourceId={headerCell.resourceId}
                                            columns={headerCell.columns}
                                            title={resolveCalendarResourceTitle(
                                                resources,
                                                headerCell.resource,
                                                headerCell.resourceId
                                            )}
                                        />
                                    )}
                            </div>
                        ))
                    )}
                </div>
                <div className="time-grid-view_body">
                    <div
                        className="time-grid-view_time-labels"
                        style={{
                            gridTemplateRows: gridRows,
                            height: gridHeight,
                            minHeight: gridMinHeight
                        }}
                    >
                        {dividers.map(({ key, time, startRow, rowSpan }) => (
                            <div
                                key={key}
                                className="time-grid-view_time-label"
                                style={{ gridRow: `${startRow} / span ${rowSpan}` }}
                            >
                                <time dateTime={format(time, "HH:mm")}>
                                    {formatters.time(time, formatContext)}
                                </time>
                            </div>
                        ))}
                    </div>
                    <div
                        ref={gridRef}
                        className="time-grid-view_grid"
                        style={{
                            gridTemplateRows: gridRows,
                            height: gridHeight,
                            minHeight: gridMinHeight
                        }}
                    >
                        {slots.map((slot) => {
                            const rendererSlot = toTimeGridSlot(slot);
                            const selected = calendarSelectedRange
                                && calendarSelectedRange.start < slot.end
                                && calendarSelectedRange.end > slot.start;
                            const handleSelect = onSlotSelect
                                ? (interaction: SyntheticEvent) => onSlotSelect(
                                    rendererSlot,
                                    interaction
                                )
                                : undefined;

                            return (
                                <SlotComponent
                                    key={`${slot.key}-slot`}
                                    slot={rendererSlot}
                                    selected={Boolean(selected)}
                                    elementProps={{
                                        className: `time-grid-view_slot${slot.columnIndex === 0
                                            ? " is-first-column"
                                            : ""}${slot.isDividerBoundary
                                            ? " is-divider-boundary"
                                            : ""}`,
                                        "aria-label": handleSelect
                                            ? messages.slotLabel({
                                                view: viewName,
                                                date: formatters.date(slot.start, formatContext),
                                                time: formatters.time(slot.start, formatContext)
                                            })
                                            : undefined,
                                        onClick: handleSelect,
                                        onDragOver: canDropEvents
                                            ? (interaction) => interaction.preventDefault()
                                            : undefined,
                                        onDrop: canDropEvents
                                            ? (interaction) => handleDrop(interaction, slot)
                                            : undefined,
                                        style: {
                                            gridRow: `${(slot.timeIndex * slotDuration) + 1} / ${(slot.timeIndex * slotDuration) + 1 + slot.duration}`,
                                            gridColumn: slot.columnIndex + 1
                                        }
                                    }}
                                />
                            );
                        })}
                        {eventResize?.target && (
                            <div
                                className="time-grid-view_resize-preview"
                                style={{
                                    gridColumn: eventResize.target.columnIndex + 1,
                                    gridRow: getResizePreviewRows(
                                        eventResize.target.row,
                                        totalMinutes
                                    )
                                }}
                            />
                        )}
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
                                    const rendererSegment = toTimeGridEventSegment(segment);

                                    return (
                                        <BackgroundEventComponent
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
                                    const rendererSegment = toTimeGridEventSegment(segment);
                                    const interactionContext = {
                                        view: viewName,
                                        occurrence: {
                                            day: segment.day,
                                            resource: segment.resource,
                                            resourceId: segment.resourceId
                                        }
                                    };
                                    const draggable = canDropEvents
                                        && (canDragEvent?.(event, rendererSegment) ?? true);
                                    const interactionProps = createEventInteractionProps({
                                        event,
                                        context: interactionContext,
                                        canSelectEvent,
                                        canOpenEvent,
                                        onEventSelect,
                                        onEventOpen,
                                        eventInteractions
                                    });
                                    const selected = event.id != null
                                        && selectedEventIds.includes(event.id);
                                    const startDate = formatters.date(event.start, formatContext);
                                    const startTime = formatters.time(event.start, formatContext);
                                    const endDate = formatters.date(event.end, formatContext);
                                    const endTime = formatters.time(event.end, formatContext);
                                    const interactive = interactionProps.onClick != null
                                        || interactionProps.onDoubleClick != null
                                        || interactionProps.onContextMenu != null
                                        || interactionProps.onKeyDown != null;
                                    const eventKey = `${event.id ?? event.title ?? "event"}-${event.start.getTime()}-${event.end.getTime()}-${columnIndex}`;

                                    return (
                                        <Fragment key={eventKey}>
                                            <EventComponent
                                                event={event}
                                                segment={rendererSegment}
                                                selected={selected}
                                                elementProps={{
                                                    className: "time-grid-view_event",
                                                    draggable,
                                                    onDragStart: draggable
                                                        ? () => setDraggedEvent(segment)
                                                        : undefined,
                                                    onDragEnd: draggable
                                                        ? () => setDraggedEvent(null)
                                                        : undefined,
                                                    ...interactionProps,
                                                    "aria-label": interactive
                                                        ? messages.eventLabel({
                                                            view: viewName,
                                                            title: event.title,
                                                            description: event.description,
                                                            startDate,
                                                            startTime,
                                                            endDate,
                                                            endTime
                                                        })
                                                        : undefined,
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

                                                const boundaries = createTimeGridResizeBoundaries({
                                                    event,
                                                    edge,
                                                    resourceId: segment.resourceId,
                                                    slots,
                                                    slotDuration
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
                                                        handleKey
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
                                                        aria-valuemin={firstBoundary.date.getTime()}
                                                        aria-valuemax={lastBoundary.date.getTime()}
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
                </div>
            </div>
        </div>
    );
}
