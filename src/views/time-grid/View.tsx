"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef
} from "react";

import CalendarNavigation from "../../components/CalendarNavigation.js";
import type {
    EventBehavior,
    ViewText
} from "../../components/eventPresentation.js";
import { normalizeEventCollection } from "../../core/events.js";
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
import type { CalendarEvent } from "../../types.js";
import DefaultBackground from "./DefaultBackground.js";
import DefaultDayHeader from "./DefaultDayHeader.js";
import DefaultEvent from "./DefaultEvent.js";
import DefaultResourceHeader from "./DefaultResourceHeader.js";
import DefaultSlot from "./DefaultSlot.js";
import Header from "./Header.js";
import { createHeaderModel } from "./headerModel.js";
import { createLayout } from "./layout/createLayout.js";
import { createHeaderRows } from "./layout/headers.js";
import { createMultiDayEventLayout } from "./layout/multiDayEvents.js";
import {
    createResizeIntervals,
    resolveResizeStep
} from "./resize.js";
import MultiDayEvents from "./MultiDayEvents.js";
import { partitionEvents } from "./eventModel.js";
import type { EventRendering } from "./eventModel.js";
import { createGridSizing } from "./sizing.js";
import Slots from "./Slots.js";
import TimedEvents from "./TimedEvents.js";
import TimeLabels from "./TimeLabels.js";
import type { ViewProps } from "./types.js";
import { useInteractionController } from "./interactions/useController.js";

const EMPTY_ITEMS: never[] = [];
const EMPTY_COMPONENTS = /* @__PURE__ */ Object.freeze({});

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
export default function View<
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
}: ViewProps<Event, Resource>) {
    const {
        slot: SlotRenderer = DefaultSlot,
        event: EventRenderer = DefaultEvent,
        backgroundEvent: BackgroundRenderer = DefaultBackground,
        dayHeader: DayHeaderRenderer = DefaultDayHeader,
        resourceHeader: ResourceHeaderRenderer = DefaultResourceHeader,
        navigation: NavigationRenderer
    } = components;
    const gridWrapperRef = useRef<HTMLDivElement>(null);
    const calendarLocale = readCalendarLocale(locale);
    const weekStart = resolveCalendarWeekStart(calendarLocale, weekStartProp);
    const formatContext = useMemo(
        () => ({ locale: calendarLocale, view: viewName }),
        [calendarLocale, viewName]
    );
    const text = useMemo<ViewText>(() => ({
        formatters,
        messages,
        context: formatContext
    }), [formatContext, formatters, messages]);
    const eventBehavior = useMemo<EventBehavior<Event, Resource>>(() => ({
        selectedIds: selectedEventIds,
        canSelect: canSelectEvent,
        canOpen: canOpenEvent,
        onSelect: onEventSelect,
        onOpen: onEventOpen,
        interactions: eventInteractions
    }), [
        canOpenEvent,
        canSelectEvent,
        eventInteractions,
        onEventOpen,
        onEventSelect,
        selectedEventIds
    ]);
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
    const eventCollection = useMemo(
        () => normalizeEventCollection(events, timeZone),
        [events, timeZone]
    );
    const calendarEvents = eventCollection.events;
    const { timedEvents, dedicatedEvents } = useMemo(
        () => partitionEvents(calendarEvents, multiDayEventLayout),
        [calendarEvents, multiDayEventLayout]
    );
    const backgroundEventCollection = useMemo(
        () => normalizeEventCollection(backgroundEvents, timeZone),
        [backgroundEvents, timeZone]
    );
    const calendarBackgroundEvents = backgroundEventCollection.events;
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
    const resolvedResizeStep = resolveResizeStep(resizeStep);
    const resizeIntervals = useMemo(
        () => canResizeEvents
            ? createResizeIntervals({
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
        () => createHeaderRows(columns, groupBy),
        [columns, groupBy]
    );
    const headerModel = useMemo(
        () => createHeaderModel(columns, headerRows, resources, text),
        [columns, headerRows, resources, text]
    );
    const hasResourceHeaders = headerModel.hasResourceHeaders;
    const gridSizing = createGridSizing(
        slotSizing,
        totalMinutes,
        slotDuration,
        columns.length,
        hasResourceHeaders ? 2 : 1
    );

    const calendarRange = { start: rangeStart, end: rangeEnd, days };
    const navigationContext = { view: viewName, range: calendarRange };
    const header = formatters.rangeHeader(calendarRange, formatContext);
    const navigationState = getCalendarNavigationState({
        anchorDate,
        periodStart: rangeStart,
        periodEnd: rangeEnd,
        ...navigationBoundaries
    });
    const canMoveEvents = onEventDrop != null;
    const selectableSlots = onSlotSelect != null;
    const interaction = useInteractionController({
        columns,
        slots,
        totalMinutes,
        slotDuration,
        onEventDrop,
        onEventResize
    });
    const {
        stageRef: gridStageRef,
        multiDayRef: multiDayGridRef,
        timed: timedInteractions,
        multiDay: multiDayInteractions
    } = interaction;
    const eventRendering = useMemo<EventRendering<Event, Resource>>(() => ({
        renderer: EventRenderer,
        getEventKey: eventCollection.getKey,
        behavior: eventBehavior,
        text,
        moveEnabled: canMoveEvents,
        resizeEnabled: canResizeEvents,
        canDrag: canDragEvent,
        canResize: canResizeEvent
    }), [
        EventRenderer,
        canDragEvent,
        canMoveEvents,
        canResizeEvent,
        canResizeEvents,
        eventCollection,
        eventBehavior,
        text
    ]);
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
            className={`time-grid-view${gridSizing.fixedWidth !== undefined
                ? " has-fixed-slot-width"
                : ""}${gridSizing.fixedHeight !== undefined
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
                    navigation={NavigationRenderer}
                />
            )}
            <div
                ref={gridWrapperRef}
                className="time-grid-view_grid-wrapper calendar-scroll-region"
                aria-label={selectableSlots
                    ? undefined
                    : messages.timeGridLabel({ view: viewName })}
                data-group-by={hasResourceHeaders ? groupBy : undefined}
                style={gridSizing.wrapperStyle}
                tabIndex={selectableSlots ? undefined : 0}
            >
                <Header
                    model={headerModel}
                    dayRenderer={DayHeaderRenderer}
                    resourceRenderer={ResourceHeaderRenderer}
                />
                <MultiDayEvents
                    layout={dedicatedLayout}
                    columns={columns}
                    resources={resources}
                    rendering={eventRendering}
                    interactions={multiDayInteractions}
                    gridRef={multiDayGridRef}
                />
                <div className="time-grid-view_body">
                    <TimeLabels
                        dividers={layout.dividers}
                        rowTemplate={gridSizing.rowTemplate}
                        height={gridSizing.height}
                        minHeight={gridSizing.minHeight}
                        text={text}
                    />
                    <div
                        ref={gridStageRef}
                        className="time-grid-view_grid-stage"
                        style={{
                            height: gridSizing.height,
                            minHeight: gridSizing.minHeight
                        }}
                    >
                        <Slots
                            layout={layout}
                            slotDuration={slotDuration}
                            selectedRange={calendarSelectedRange}
                            columnLabels={headerModel.columnLabels}
                            renderer={SlotRenderer}
                            onSelect={onSlotSelect}
                            wrapperRef={gridWrapperRef}
                            stageRef={gridStageRef}
                            text={text}
                        />
                        <TimedEvents
                            layout={layout}
                            eventsByColumn={eventsByColumn}
                            backgroundEventsByColumn={backgroundEventsByColumn}
                            backgroundRenderer={BackgroundRenderer}
                            getBackgroundEventKey={backgroundEventCollection.getKey}
                            resizeIntervals={resizeIntervals}
                            resources={resources}
                            rendering={eventRendering}
                            interactions={timedInteractions}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
