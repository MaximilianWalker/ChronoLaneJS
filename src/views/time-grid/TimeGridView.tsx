"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent, SyntheticEvent } from "react";
import { format } from "date-fns/format";
import { startOfDay } from "date-fns/startOfDay";

import CalendarNavigation from "../../components/CalendarNavigation.js";
import { createEventInteractionProps } from "../../components/eventInteraction.js";
import { asCalendarDate } from "../../core/date.js";
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
import {
    getCalendarRangeBounds,
    moveCalendarDate,
    resolveCalendarRange
} from "../../core/range.js";
import { useCalendarViewDate } from "../../hooks/useViewDate.js";
import type {
    CalendarEvent,
    CalendarStyle
} from "../../types.js";
import Background from "./Background.js";
import DayHeader from "./DayHeader.js";
import { createEventDrop } from "./drop.js";
import Event from "./Event.js";
import { createLayout } from "./layout/createLayout.js";
import { createTimeGridHeaderRows } from "./layout/headers.js";
import ResourceHeader from "./ResourceHeader.js";
import { resolveCalendarResourceTitle } from "./resources.js";
import { resolveSlotDimension } from "./sizing.js";
import Slot from "./Slot.js";
import type {
    TimeGridEventLayout,
    TimeGridSlot as TimeGridSlotValue,
    TimeGridViewProps
} from "./types.js";

const EMPTY_ITEMS: never[] = [];
const EMPTY_COMPONENTS = Object.freeze({});
const DEFAULT_SLOT_HEIGHT = 50;

/** Rounds percentages to stable CSS values without visible precision noise. */
const percentage = (value: number): number => Number(value.toFixed(6));

/** Calculates the width and horizontal offset of one overlapping event lane. */
const getLaneStyle = ({
    laneIndex,
    laneCount
}: Pick<TimeGridEventLayout, "laneIndex" | "laneCount">): CalendarStyle => {
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
 * event clipping, overlap lanes, and drag-and-drop calculations. Markup for
 * slots, events, background events, and hierarchical headers can be replaced
 * through `components` without replacing layout behavior.
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
    navigationStep,
    navigateDate,
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
    canEditEvent,
    onDateChange,
    onRangeChange,
    onEventSelect,
    onEventEdit,
    onEventDrop,
    onSlotSelect,
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
        TimeGridEventLayout<Event, Resource> | null
    >(null);
    const calendarLocale = readCalendarLocale(locale);
    const weekStart = resolveCalendarWeekStart(calendarLocale, weekStartProp);
    const { anchorDate, setDate } = useCalendarViewDate({
        date: controlledDate,
        defaultDate,
        timeZone,
        onDateChange
    });
    const days = useMemo(() => resolveCalendarRange(range, anchorDate, {
        weekStartsOn: weekStart
    }), [anchorDate, range, weekStart]);
    const { start: rangeStart, end: rangeEnd } = getCalendarRangeBounds(days);
    const calendarMinDate = useMemo(
        () => minDate == null ? null : asCalendarDate(minDate, timeZone),
        [minDate, timeZone]
    );
    const calendarMaxDate = useMemo(
        () => maxDate == null ? null : asCalendarDate(maxDate, timeZone),
        [maxDate, timeZone]
    );
    const calendarEvents = useMemo(
        () => normalizeEvents(events, timeZone),
        [events, timeZone]
    );
    const calendarBackgroundEvents = useMemo(
        () => normalizeEvents(backgroundEvents, timeZone),
        [backgroundEvents, timeZone]
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
    const effectiveNavigationStep = navigationStep
        ?? (range && typeof range === "object" && !Array.isArray(range)
            ? range.navigationStep
            : null)
        ?? Math.max(1, Math.round(
            (rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000
        ) + 1);
    const minBoundary = calendarMinDate && startOfDay(calendarMinDate);
    const maxBoundary = calendarMaxDate && startOfDay(calendarMaxDate);
    const canDropEvents = onEventDrop != null;

    const navigate = useCallback((direction: -1 | 1) => {
        const nextDate = navigateDate
            ? navigateDate(anchorDate, direction, {
                days,
                start: rangeStart,
                end: rangeEnd
            })
            : moveCalendarDate(anchorDate, direction, effectiveNavigationStep);
        setDate(nextDate);
    }, [
        anchorDate,
        days,
        effectiveNavigationStep,
        navigateDate,
        rangeEnd,
        rangeStart,
        setDate
    ]);

    useEffect(() => {
        onRangeChange?.({ start: rangeStart, end: rangeEnd, days });
    }, [days, onRangeChange, rangeEnd, rangeStart]);

    const handleDrop = useCallback((
        interaction: DragEvent<HTMLElement>,
        slot: TimeGridSlotValue<Resource>
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
                    previousDisabled={Boolean(minBoundary && rangeStart <= minBoundary)}
                    nextDisabled={Boolean(maxBoundary && rangeEnd >= maxBoundary)}
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
                                            dayIndex={headerCell.dayIndex}
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
                                            resourceIndex={headerCell.resourceIndex}
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
                        className="time-grid-view_grid"
                        style={{
                            gridTemplateRows: gridRows,
                            height: gridHeight,
                            minHeight: gridMinHeight
                        }}
                    >
                        {slots.map((slot) => {
                            const selected = selectedRange
                                && selectedRange.start < slot.end
                                && selectedRange.end > slot.start;
                            const handleSelect = onSlotSelect
                                ? (interaction: SyntheticEvent) => onSlotSelect(slot, interaction)
                                : undefined;

                            return (
                                <SlotComponent
                                    key={`${slot.key}-slot`}
                                    slot={slot}
                                    selected={Boolean(selected)}
                                    elementProps={{
                                        className: "time-grid-view_slot",
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
                                {(backgroundEventsByColumn[columnIndex] ?? []).map((segment) => (
                                    <BackgroundEventComponent
                                        key={`${segment.id ?? "background"}-${segment.start.getTime()}-${columnIndex}`}
                                        event={segment.event}
                                        segment={segment}
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
                                ))}
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
                                    const draggable = canDropEvents
                                        && (canDragEvent?.(event, segment) ?? true);
                                    const interactionProps = createEventInteractionProps({
                                        event,
                                        onEventSelect,
                                        onEventEdit,
                                        canEditEvent
                                    });
                                    const selected = event.id != null
                                        && selectedEventIds.includes(event.id);
                                    const startDate = formatters.date(event.start, formatContext);
                                    const startTime = formatters.time(event.start, formatContext);
                                    const endDate = formatters.date(event.end, formatContext);
                                    const endTime = formatters.time(event.end, formatContext);
                                    const interactive = interactionProps.onClick != null
                                        || interactionProps.onDoubleClick != null;

                                    return (
                                        <EventComponent
                                            key={`${event.id ?? event.title ?? "event"}-${segment.start.getTime()}-${segment.end.getTime()}-${columnIndex}`}
                                            event={event}
                                            segment={segment}
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
