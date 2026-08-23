"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef
} from "react";
import type { SyntheticEvent } from "react";
import { format } from "date-fns/format";

import CalendarNavigation from "../../components/CalendarNavigation.js";
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
    CalendarStyle
} from "../../types.js";
import DefaultBackground from "./DefaultBackground.js";
import { toSlot } from "./contracts.js";
import DefaultDayHeader from "./DefaultDayHeader.js";
import DefaultEvent from "./DefaultEvent.js";
import DefaultResourceHeader from "./DefaultResourceHeader.js";
import DefaultSlot from "./DefaultSlot.js";
import { createLayout } from "./layout/createLayout.js";
import { createHeaderRows } from "./layout/headers.js";
import {
    createMultiDayEventLayout,
    isMultiDayEvent
} from "./layout/multiDayEvents.js";
import {
    createResizeIntervals,
    resolveResizeStep
} from "./resize.js";
import { resolveCalendarResourceTitle } from "./resources.js";
import MultiDayEvents from "./MultiDayEvents.js";
import type { EventRendering } from "./rendering.js";
import { resolveSlotDimension } from "./sizing.js";
import TimedEvents from "./TimedEvents.js";
import type { ViewProps } from "./types.js";
import { useInteractions } from "./useInteractions.js";
import { useSlotNavigation } from "./useSlotNavigation.js";

const EMPTY_ITEMS: never[] = [];
const EMPTY_COMPONENTS = /* @__PURE__ */ Object.freeze({});
const DEFAULT_SLOT_HEIGHT = 50;

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
        slotRows,
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
    const columnHeaderLabels = useMemo(() => columns.map((_, columnIndex) => (
        [headerRows.primary, headerRows.secondary].flatMap((headers) => (
            headers.filter((headerCell) => (
                columnIndex >= headerCell.columnIndex
                && columnIndex < headerCell.columnIndex + headerCell.columns.length
            ))
        )).map((headerCell) => {
            if (headerCell.kind === "day") {
                return formatters.dayHeader(headerCell.day, formatContext);
            }

            const title = resolveCalendarResourceTitle(
                resources,
                headerCell.resource,
                headerCell.resourceId
            );
            return typeof title === "string" || typeof title === "number"
                ? String(title)
                : String(headerCell.resourceId);
        }).join(", ")
    )), [columns, formatContext, formatters, headerRows, resources]);
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
    const interaction = useInteractions({
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
        selectedIds: selectedEventIds,
        moveEnabled: canMoveEvents,
        resizeEnabled: canResizeEvents,
        canDrag: canDragEvent,
        canResize: canResizeEvent,
        canSelect: canSelectEvent,
        canOpen: canOpenEvent,
        onSelect: onEventSelect,
        onOpen: onEventOpen,
        interactions: eventInteractions,
        formatters,
        messages,
        formatContext,
        viewName
    }), [
        EventRenderer,
        canDragEvent,
        canMoveEvents,
        canOpenEvent,
        canResizeEvent,
        canResizeEvents,
        canSelectEvent,
        eventInteractions,
        formatContext,
        formatters,
        messages,
        onEventOpen,
        onEventSelect,
        selectedEventIds,
        viewName
    ]);
    const selectedSlotIndex = calendarSelectedRange == null
        ? -1
        : slots.findIndex((slot) => (
            calendarSelectedRange.start < slot.end
            && calendarSelectedRange.end > slot.start
        ));
    const {
        rovingIndex: rovingSlotIndex,
        registerCell: registerSlotCell,
        setActiveKey: setActiveSlotKey,
        handleKeyDown: handleSlotNavigation
    } = useSlotNavigation({
        slots,
        columnCount: columns.length,
        selectedIndex: selectedSlotIndex,
        selectable: selectableSlots,
        wrapperRef: gridWrapperRef,
        stageRef: gridStageRef
    });

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
                style={gridWrapperStyle}
                tabIndex={selectableSlots ? undefined : 0}
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
                                        <DayHeaderRenderer
                                            day={headerCell.day}
                                            columns={headerCell.columns}
                                            title={formatters.dayHeader(
                                                headerCell.day,
                                                formatContext
                                            )}
                                        />
                                    )
                                    : (
                                        <ResourceHeaderRenderer
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
                <MultiDayEvents
                    layout={dedicatedLayout}
                    columns={columns}
                    resources={resources}
                    rendering={eventRendering}
                    interactions={multiDayInteractions}
                    gridRef={multiDayGridRef}
                />
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
                        ref={gridStageRef}
                        className="time-grid-view_grid-stage"
                        style={{
                            height: gridHeight,
                            minHeight: gridMinHeight
                        }}
                    >
                        <div
                            className="time-grid-view_grid"
                            role={selectableSlots ? "grid" : undefined}
                            aria-label={selectableSlots
                                ? messages.timeGridLabel({ view: viewName })
                                : undefined}
                            aria-multiselectable={selectableSlots || undefined}
                            style={{ gridTemplateRows: gridRows }}
                        >
                            {selectableSlots && (
                                <div
                                    role="row"
                                    className="time-grid-view_accessible-header-row"
                                >
                                    {columns.map((column, columnIndex) => (
                                        <div
                                            key={`${column.key}-accessible-header`}
                                            role="columnheader"
                                        >
                                            {columnHeaderLabels[columnIndex]}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {slotRows.map((row, rowIndex) => {
                                const firstSlot = row[0];
                                if (!firstSlot) return null;

                                return (
                                    <div
                                        key={`${firstSlot.key}-row`}
                                        role={selectableSlots ? "row" : undefined}
                                        className="time-grid-view_slot-row"
                                        style={{
                                            gridColumn: "1 / -1",
                                            gridRow: `${(firstSlot.timeIndex * slotDuration) + 1} / span ${firstSlot.duration}`
                                        }}
                                    >
                                        {row.map((slot) => {
                                            const slotIndex = (rowIndex * columns.length)
                                                + slot.columnIndex;
                                            const rendererSlot = toSlot(slot);
                                            const selected = calendarSelectedRange
                                                && calendarSelectedRange.start < slot.end
                                                && calendarSelectedRange.end > slot.start;
                                            const handleSelect = onSlotSelect
                                                ? (interaction: SyntheticEvent) => {
                                                    setActiveSlotKey(slot.key);
                                                    onSlotSelect(rendererSlot, interaction);
                                                }
                                                : undefined;

                                            return (
                                                <div
                                                    key={`${slot.key}-cell`}
                                                    ref={(element) => registerSlotCell(
                                                        slot.key,
                                                        element
                                                    )}
                                                    role={selectableSlots
                                                        ? "gridcell"
                                                        : undefined}
                                                    aria-selected={selectableSlots
                                                        ? Boolean(selected)
                                                        : undefined}
                                                    className="time-grid-view_slot-cell"
                                                    style={{
                                                        gridColumn: slot.columnIndex + 1
                                                    }}
                                                >
                                                    <SlotRenderer
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
                                                                    date: formatters.date(
                                                                        slot.start,
                                                                        formatContext
                                                                    ),
                                                                    time: formatters.time(
                                                                        slot.start,
                                                                        formatContext
                                                                    )
                                                                })
                                                                : undefined,
                                                            onClick: handleSelect,
                                                            onFocus: handleSelect
                                                                ? () => setActiveSlotKey(slot.key)
                                                                : undefined,
                                                            onKeyDown: handleSelect
                                                                ? (interaction) => handleSlotNavigation(
                                                                    interaction,
                                                                    slotIndex
                                                                )
                                                                : undefined,
                                                            tabIndex: handleSelect
                                                                ? slotIndex === rovingSlotIndex
                                                                    ? 0
                                                                    : -1
                                                                : undefined
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                        <TimedEvents
                            layout={layout}
                            eventsByColumn={eventsByColumn}
                            backgroundEventsByColumn={backgroundEventsByColumn}
                            backgroundRenderer={BackgroundRenderer}
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
