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
import Event from "./Event.js";
import { createLayout } from "./layout/createLayout.js";
import { createTimeGridHeaderRows } from "./layout/headers.js";
import {
    createMultiDayEventDrop,
    createMultiDayEventLayout,
    createMultiDayEventPreview,
    createMultiDayEventResize,
    getMultiDayMoveTargetIndex,
    getMultiDayPointerColumnIndex,
    getMultiDayResizeOffset,
    isMultiDayEvent
} from "./layout/multiDayEvents.js";
import type { LayoutMultiDayEvent } from "./layout/multiDayEvents.js";
import type {
    LayoutColumn,
    LayoutEvent,
    LayoutSlot
} from "./layout/types.js";
import {
    createEventDrop,
    findAdjacentMoveSlot,
    findEventMoveOrigin,
    findPointerMoveSlot
} from "./move.js";
import { createTimeGridEventPreviewSegments } from "./preview.js";
import {
    createEventResize,
    createTimeGridResizeBoundaries,
    createTimeGridResizeIntervals,
    findAdjacentResizeBoundary,
    findClosestResizeBoundary,
    resolveTimeGridResizeStep
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

interface EventMoveState<
    Event extends CalendarEvent,
    Resource
> {
    segment: LayoutEvent<Event, Resource>;
    origin: LayoutSlot<Resource>;
    handleKey: string;
    pointerId?: number;
    target?: LayoutSlot<Resource>;
}

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

interface MultiDayEventMoveState<
    Event extends CalendarEvent,
    Resource
> {
    segment: LayoutMultiDayEvent<Event, Resource>;
    origin: LayoutColumn<Resource>;
    handleKey: string;
    pointerId?: number;
    grabColumnIndex?: number;
    target?: LayoutColumn<Resource>;
}

interface MultiDayEventResizeState<
    Event extends CalendarEvent,
    Resource
> {
    segment: LayoutMultiDayEvent<Event, Resource>;
    edge: TimeGridEventResizeEdge;
    source: TimeGridEventPosition<Resource>;
    dayOffsets: number[];
    handleKey: string;
    pointerId?: number;
    targetOffset?: number;
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
 * event clipping, overlap lanes, event movement, and step-snapped resizing. Markup
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
    multiDayEventLayout = "timed",
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
    resizeStep = slotDuration,
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
    const [eventMove, setEventMove] = useState<
        EventMoveState<Event, Resource> | null
    >(null);
    const [eventResize, setEventResize] = useState<
        EventResizeState<Event, Resource> | null
    >(null);
    const [multiDayEventMove, setMultiDayEventMove] = useState<
        MultiDayEventMoveState<Event, Resource> | null
    >(null);
    const [multiDayEventResize, setMultiDayEventResize] = useState<
        MultiDayEventResizeState<Event, Resource> | null
    >(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const multiDayGridRef = useRef<HTMLDivElement>(null);
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
    if (multiDayEventLayout !== "timed" && multiDayEventLayout !== "dedicated") {
        throw new TypeError(
            'multiDayEventLayout must be either "timed" or "dedicated".'
        );
    }
    const { timedEvents, dedicatedEvents } = useMemo(() => {
        if (multiDayEventLayout === "timed") {
            return { timedEvents: calendarEvents, dedicatedEvents: EMPTY_ITEMS };
        }

        return {
            timedEvents: calendarEvents.filter((event) => !isMultiDayEvent(event)),
            dedicatedEvents: calendarEvents.filter(isMultiDayEvent)
        };
    }, [calendarEvents, multiDayEventLayout]);
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
        events: timedEvents,
        backgroundEvents: calendarBackgroundEvents,
        resources,
        groupBy,
        minTime,
        maxTime,
        slotDuration,
        labelInterval
    }), [
        calendarBackgroundEvents,
        days,
        groupBy,
        labelInterval,
        maxTime,
        minTime,
        resources,
        slotDuration,
        timedEvents
    ]);
    const {
        columns,
        timeWindow,
        slots,
        dividers,
        events: positionedEvents,
        backgroundEvents: positionedBackgroundEvents,
        totalMinutes
    } = layout;
    const dedicatedLayout = useMemo(() => createMultiDayEventLayout({
        events: dedicatedEvents,
        columns,
        resources
    }), [columns, dedicatedEvents, resources]);
    const canResizeEvents = onEventResize != null;
    const resolvedResizeStep = resolveTimeGridResizeStep(resizeStep);
    const resizeIntervals = useMemo(
        () => canResizeEvents
            ? createTimeGridResizeIntervals({
                columns,
                timeWindow,
                resizeStep: resolvedResizeStep
            })
            : [],
        [canResizeEvents, columns, resolvedResizeStep, timeWindow]
    );
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
    const formatContext = useMemo(
        () => ({ locale: calendarLocale, view: viewName }),
        [calendarLocale, viewName]
    );
    const navigationContext = { view: viewName, range: calendarRange };
    const header = formatters.rangeHeader(calendarRange, formatContext);
    const navigationState = getCalendarNavigationState({
        anchorDate,
        periodStart: rangeStart,
        periodEnd: rangeEnd,
        ...navigationBoundaries
    });
    const canMoveEvents = onEventDrop != null;

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
            segments: createTimeGridEventPreviewSegments({
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
            segments: createTimeGridEventPreviewSegments({
                start: change.start,
                end: change.end,
                resourceId: eventResize.source.resourceId,
                columns,
                timeWindow
            })
        };
    }, [columns, eventResize, timeWindow]);

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

    const updateEventMove = useCallback((
        next: EventMoveState<Event, Resource> | null
    ) => {
        setEventMove(next);
    }, []);

    const cancelEventMove = useCallback(() => {
        updateEventMove(null);
    }, [updateEventMove]);

    const commitEventMove = useCallback((
        current: EventMoveState<Event, Resource> | null
    ) => {
        updateEventMove(null);
        if (!current?.target || !onEventDrop) return;

        if (
            current.target.start.getTime() === current.segment.event.start.getTime()
            && current.target.resourceId === current.segment.resourceId
        ) return;

        onEventDrop(createEventDrop(current.segment, current.target));
    }, [onEventDrop, updateEventMove]);

    const beginEventMove = useCallback((
        segment: LayoutEvent<Event, Resource>,
        handleKey: string,
        pointerId?: number
    ): EventMoveState<Event, Resource> | null => {
        const origin = findEventMoveOrigin(slots, segment);
        if (!origin) return null;

        const next = {
            segment,
            origin,
            handleKey,
            pointerId
        } satisfies EventMoveState<Event, Resource>;
        setEventResize(null);
        setMultiDayEventMove(null);
        setMultiDayEventResize(null);
        updateEventMove(next);
        return next;
    }, [slots, updateEventMove]);

    const updateEventMoveTarget = useCallback((
        current: EventMoveState<Event, Resource>,
        target: LayoutSlot<Resource>,
        keepOrigin = false
    ) => {
        const nextTarget = !keepOrigin && target.key === current.origin.key
            ? undefined
            : target;
        if (current.target?.key === nextTarget?.key) return;

        updateEventMove({ ...current, target: nextTarget });
    }, [updateEventMove]);

    const handleMovePointerMove = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const current = eventMove;
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

        const columnIndex = Math.min(
            columns.length - 1,
            Math.max(0, Math.floor(
                (interaction.clientX - bounds.left) / bounds.width * columns.length
            ))
        );
        const row = 1 + Math.min(
            totalMinutes - Number.EPSILON,
            Math.max(0, (interaction.clientY - bounds.top) / bounds.height * totalMinutes)
        );
        const target = findPointerMoveSlot(
            slots,
            columnIndex,
            row,
            slotDuration
        );
        if (target) updateEventMoveTarget(current, target);
    }, [
        columns.length,
        eventMove,
        slotDuration,
        slots,
        totalMinutes,
        updateEventMoveTarget
    ]);

    const handleMovePointerUp = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const current = eventMove;
        if (!current || current.pointerId !== interaction.pointerId) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        if (interaction.currentTarget.hasPointerCapture(interaction.pointerId)) {
            interaction.currentTarget.releasePointerCapture(interaction.pointerId);
        }
        commitEventMove(current);
    }, [commitEventMove, eventMove]);

    const handleMovePointerCancel = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const current = eventMove;
        if (!current || current.pointerId !== interaction.pointerId) return;

        interaction.stopPropagation();
        cancelEventMove();
    }, [cancelEventMove, eventMove]);

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
        boundaries: TimeGridResizeBoundary<Resource>[],
        pointerId?: number
    ): EventResizeState<Event, Resource> | null => {
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
        setEventMove(null);
        setMultiDayEventMove(null);
        setMultiDayEventResize(null);
        updateEventResize(next);
        return next;
    }, [updateEventResize]);

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

    const cancelMultiDayEventMove = useCallback(() => {
        setMultiDayEventMove(null);
    }, []);

    const commitMultiDayEventMove = useCallback((
        current: MultiDayEventMoveState<Event, Resource> | null
    ) => {
        setMultiDayEventMove(null);
        if (!current?.target || !onEventDrop) return;
        if (
            current.target.day.getTime() === current.origin.day.getTime()
            && current.target.resourceId === current.origin.resourceId
        ) return;

        onEventDrop(createMultiDayEventDrop(current.segment, current.target));
    }, [onEventDrop]);

    const beginMultiDayEventMove = useCallback((
        segment: LayoutMultiDayEvent<Event, Resource>,
        handleKey: string,
        pointerId?: number,
        grabColumnIndex?: number
    ): MultiDayEventMoveState<Event, Resource> | null => {
        const origin = columns[segment.columnIndex];
        if (!origin) return null;

        const next = {
            segment,
            origin,
            handleKey,
            pointerId,
            grabColumnIndex
        } satisfies MultiDayEventMoveState<Event, Resource>;
        setEventMove(null);
        setEventResize(null);
        setMultiDayEventResize(null);
        setMultiDayEventMove(next);
        return next;
    }, [columns]);

    const updateMultiDayEventMoveTarget = useCallback((
        current: MultiDayEventMoveState<Event, Resource>,
        target: LayoutColumn<Resource>
    ) => {
        const nextTarget = target.key === current.origin.key ? undefined : target;
        if (current.target?.key === nextTarget?.key) return;
        setMultiDayEventMove({ ...current, target: nextTarget });
    }, []);

    const handleMultiDayMovePointerMove = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const current = multiDayEventMove;
        const grid = multiDayGridRef.current;
        if (
            !current
            || current.pointerId !== interaction.pointerId
            || current.grabColumnIndex == null
            || !grid
            || columns.length === 0
        ) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        const bounds = grid.getBoundingClientRect();
        if (bounds.width <= 0) return;
        const columnIndex = getMultiDayPointerColumnIndex(
            interaction.clientX,
            bounds.left,
            bounds.width,
            columns.length
        );
        if (columnIndex == null) return;
        const targetIndex = getMultiDayMoveTargetIndex(
            current.segment.columnIndex,
            current.grabColumnIndex,
            columnIndex,
            columns.length
        );
        const target = targetIndex == null ? undefined : columns[targetIndex];
        if (target) updateMultiDayEventMoveTarget(current, target);
    }, [columns, multiDayEventMove, updateMultiDayEventMoveTarget]);

    const handleMultiDayMovePointerUp = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const current = multiDayEventMove;
        if (!current || current.pointerId !== interaction.pointerId) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        if (interaction.currentTarget.hasPointerCapture(interaction.pointerId)) {
            interaction.currentTarget.releasePointerCapture(interaction.pointerId);
        }
        commitMultiDayEventMove(current);
    }, [commitMultiDayEventMove, multiDayEventMove]);

    const handleMultiDayMovePointerCancel = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        if (multiDayEventMove?.pointerId !== interaction.pointerId) return;
        interaction.stopPropagation();
        cancelMultiDayEventMove();
    }, [cancelMultiDayEventMove, multiDayEventMove]);

    const cancelMultiDayEventResize = useCallback(() => {
        setMultiDayEventResize(null);
    }, []);

    const commitMultiDayEventResize = useCallback((
        current: MultiDayEventResizeState<Event, Resource> | null
    ) => {
        setMultiDayEventResize(null);
        if (current?.targetOffset == null || !onEventResize) return;

        onEventResize(createMultiDayEventResize({
            event: current.segment.event,
            edge: current.edge,
            dayOffset: current.targetOffset,
            source: current.source
        }));
    }, [onEventResize]);

    const beginMultiDayEventResize = useCallback((
        segment: LayoutMultiDayEvent<Event, Resource>,
        edge: TimeGridEventResizeEdge,
        handleKey: string,
        dayOffsets: number[],
        pointerId?: number
    ): MultiDayEventResizeState<Event, Resource> | null => {
        if (dayOffsets.length === 0) return null;

        const next = {
            segment,
            edge,
            source: {
                day: segment.day,
                resource: segment.resource,
                resourceId: segment.resourceId
            },
            dayOffsets,
            handleKey,
            pointerId
        } satisfies MultiDayEventResizeState<Event, Resource>;
        setEventMove(null);
        setEventResize(null);
        setMultiDayEventMove(null);
        setMultiDayEventResize(next);
        return next;
    }, []);

    const handleMultiDayResizePointerMove = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const current = multiDayEventResize;
        const grid = multiDayGridRef.current;
        if (
            !current
            || current.pointerId !== interaction.pointerId
            || !grid
            || columns.length === 0
        ) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        const bounds = grid.getBoundingClientRect();
        if (bounds.width <= 0) return;
        const rawColumnIndex = getMultiDayPointerColumnIndex(
            interaction.clientX,
            bounds.left,
            bounds.width,
            columns.length
        );
        if (rawColumnIndex == null) return;
        const pointerColumn = columns[rawColumnIndex];
        if (!pointerColumn) return;
        const targetColumn = columns.find((column) => (
            column.dayIndex === pointerColumn.dayIndex
            && column.resourceId === current.source.resourceId
        ));
        if (!targetColumn) return;
        const targetOffset = getMultiDayResizeOffset(
            current.segment.event,
            current.edge,
            targetColumn.day
        );
        if (
            !current.dayOffsets.includes(targetOffset)
            || current.targetOffset === targetOffset
        ) return;

        setMultiDayEventResize({
            ...current,
            targetOffset: targetOffset === 0 ? undefined : targetOffset
        });
    }, [columns, multiDayEventResize]);

    const handleMultiDayResizePointerUp = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        const current = multiDayEventResize;
        if (!current || current.pointerId !== interaction.pointerId) return;

        interaction.preventDefault();
        interaction.stopPropagation();
        if (interaction.currentTarget.hasPointerCapture(interaction.pointerId)) {
            interaction.currentTarget.releasePointerCapture(interaction.pointerId);
        }
        commitMultiDayEventResize(current);
    }, [commitMultiDayEventResize, multiDayEventResize]);

    const handleMultiDayResizePointerCancel = useCallback((
        interaction: PointerEvent<HTMLElement>
    ) => {
        if (multiDayEventResize?.pointerId !== interaction.pointerId) return;
        interaction.stopPropagation();
        cancelMultiDayEventResize();
    }, [cancelMultiDayEventResize, multiDayEventResize]);

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
                {dedicatedLayout.events.length > 0 && (
                    <section
                        className="time-grid-view_multi-day-region"
                        aria-label={messages.multiDayRegionLabel({ view: viewName })}
                    >
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
                                const rendererSegment = toTimeGridEventSegment<Resource>(
                                    segment,
                                    "dedicated"
                                );
                                const interactionContext = {
                                    view: viewName,
                                    occurrence: {
                                        day: segment.day,
                                        resource: segment.resource,
                                        resourceId: segment.resourceId
                                    }
                                };
                                const movable = canMoveEvents
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
                                        <EventComponent
                                            event={event}
                                            segment={rendererSegment}
                                            selected={selected}
                                            elementProps={{
                                                className: "time-grid-view_event time-grid-view_multi-day-event",
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
                                                setMultiDayEventResize({
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
                )}
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
                                        style: {
                                            gridRow: `${(slot.timeIndex * slotDuration) + 1} / ${(slot.timeIndex * slotDuration) + 1 + slot.duration}`,
                                            gridColumn: slot.columnIndex + 1
                                        }
                                    }}
                                />
                            );
                        })}
                        <div
                            role="status"
                            aria-atomic="true"
                            className="time-grid-view_live-region"
                        >
                            {movePreview?.announcement ?? multiDayMovePreview?.announcement}
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
                                    const rendererSegment = toTimeGridEventSegment<Resource>(
                                        segment
                                    );

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
                                    const rendererSegment = toTimeGridEventSegment<Resource>(
                                        segment
                                    );
                                    const interactionContext = {
                                        view: viewName,
                                        occurrence: {
                                            day: segment.day,
                                            resource: segment.resource,
                                            resourceId: segment.resourceId
                                        }
                                    };
                                    const movable = canMoveEvents
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
                                            <EventComponent
                                                event={event}
                                                segment={rendererSegment}
                                                selected={selected}
                                                elementProps={{
                                                    className: "time-grid-view_event",
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

                                                const boundaries = createTimeGridResizeBoundaries({
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
                </div>
            </div>
        </div>
    );
}
