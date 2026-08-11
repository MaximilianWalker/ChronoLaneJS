"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent, SyntheticEvent } from "react";
import { endOfDay } from "date-fns/endOfDay";
import { format } from "date-fns/format";
import { isSameMonth } from "date-fns/isSameMonth";
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
import ColumnHeader from "./ColumnHeader.js";
import { createEventDrop } from "./drop.js";
import Event from "./Event.js";
import { createLayout } from "./layout/createLayout.js";
import {
    getDefaultResourceId,
    getDefaultResourceTitle
} from "./resources.js";
import Slot from "./Slot.js";
import type {
    TimeGridEventLayout,
    TimeGridSlot as TimeGridSlotValue,
    TimeGridViewProps
} from "./types.js";

const EMPTY_ITEMS: never[] = [];

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
 * slots, events, background events, and column headers can be replaced through
 * renderer props without replacing layout behavior.
 */
export default function TimeGridView<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
>({
    events = EMPTY_ITEMS,
    backgroundEvents = EMPTY_ITEMS,
    resources = EMPTY_ITEMS,
    date: controlledDate,
    defaultDate,
    range = "week",
    navigationStep,
    navigateDate,
    weekStart: weekStartProp,
    minDate = null,
    maxDate = null,
    minTime: minTimeProp,
    maxTime: maxTimeProp,
    showControls = true,
    step = 60,
    dividerInterval = step,
    headerHeight = 50,
    timeLabelWidth = 50,
    cellWidth,
    cellHeight = 50,
    showGrid = true,
    showGridLines = true,
    dayFormat = "EEEE do",
    headerFormat = "MMMM yyyy",
    formatHeader,
    locale = DEFAULT_CALENDAR_LOCALE,
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
    getResourceId = getDefaultResourceId,
    getResourceTitle = getDefaultResourceTitle,
    getEventResourceIds,
    slotComponent: SlotComponent = Slot,
    eventComponent: EventComponent = Event,
    backgroundEventComponent: BackgroundEventComponent = Background,
    columnHeaderComponent: ColumnHeaderComponent = ColumnHeader,
    navigationButton,
    previousLabel = "Previous range",
    nextLabel = "Next range"
}: TimeGridViewProps<Event, Resource>) {
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
    const minTime = useMemo(
        () => asCalendarDate(minTimeProp ?? startOfDay(anchorDate), timeZone),
        [anchorDate, minTimeProp, timeZone]
    );
    const maxTime = useMemo(
        () => asCalendarDate(maxTimeProp ?? endOfDay(anchorDate), timeZone),
        [anchorDate, maxTimeProp, timeZone]
    );
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
        minTime,
        maxTime,
        step,
        dividerInterval,
        getResourceId,
        ...(getEventResourceIds ? { getEventResourceIds } : {})
    }), [
        calendarBackgroundEvents,
        calendarEvents,
        days,
        dividerInterval,
        getEventResourceIds,
        getResourceId,
        maxTime,
        minTime,
        resources,
        step
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
    const headerHeightValue = `${headerHeight}px`;
    const timeLabelWidthValue = `${timeLabelWidth}px`;
    const cellWidthValue = cellWidth
        ? `${cellWidth}px`
        : "minmax(var(--time-grid-day-min-width, 0px), 1fr)";
    const gridHeight = `${(totalMinutes / step) * cellHeight}px`;
    const gridRows = `repeat(${totalMinutes}, minmax(0, 1fr))`;

    const firstHeaderDate = format(rangeStart, headerFormat, { locale: calendarLocale });
    const secondHeaderDate = format(rangeEnd, headerFormat, { locale: calendarLocale });
    const defaultHeader = isSameMonth(rangeStart, rangeEnd)
        ? firstHeaderDate
        : `${firstHeaderDate} - ${secondHeaderDate}`;
    const header = formatHeader
        ? formatHeader({ start: rangeStart, end: rangeEnd, days, locale: calendarLocale })
        : defaultHeader;
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
        <div className="time-grid-view" data-time-zone={timeZone}>
            {showControls && (
                <CalendarNavigation
                    className="time-grid-view_navigation"
                    header={header}
                    onPrevious={() => navigate(-1)}
                    onNext={() => navigate(1)}
                    previousDisabled={Boolean(minBoundary && rangeStart <= minBoundary)}
                    nextDisabled={Boolean(maxBoundary && rangeEnd >= maxBoundary)}
                    previousLabel={previousLabel}
                    nextLabel={nextLabel}
                    navigationButton={navigationButton}
                />
            )}
            <div
                className="time-grid-view_grid-wrapper"
                aria-label="Calendar grid"
                tabIndex={0}
            >
                <div
                    className="time-grid-view_header"
                    style={{
                        display: "grid",
                        gridTemplateColumns: `${timeLabelWidthValue} repeat(${columns.length}, ${cellWidthValue})`,
                        gridTemplateRows: headerHeightValue
                    }}
                >
                    {columns.map((column, columnIndex) => (
                        <div
                            key={column.key}
                            className="time-grid-view_column-header"
                            style={{ gridColumn: columnIndex + 2 }}
                        >
                            <ColumnHeaderComponent
                                column={column}
                                columnIndex={columnIndex}
                                day={column.day}
                                dayIndex={column.dayIndex}
                                resource={column.resource}
                                resourceIndex={column.resourceIndex}
                                resourceTitle={column.resource == null
                                    ? null
                                    : getResourceTitle(column.resource)}
                                locale={calendarLocale}
                                dayFormat={dayFormat}
                            />
                        </div>
                    ))}
                </div>
                <div className="time-grid-view_body">
                    <div
                        className="time-grid-view_time-labels"
                        style={{
                            display: "grid",
                            gridTemplateColumns: timeLabelWidthValue,
                            gridTemplateRows: gridRows,
                            height: gridHeight
                        }}
                    >
                        {dividers.map(({ key, time, startRow, rowSpan }) => (
                            <div
                                key={key}
                                className="time-grid-view_time-label"
                                style={{ gridRow: `${startRow} / span ${rowSpan}` }}
                            >
                                <time dateTime={format(time, "HH:mm")}>
                                    {format(time, "HH:mm", { locale: calendarLocale })}
                                </time>
                            </div>
                        ))}
                    </div>
                    <div
                        className="time-grid-view_grid"
                        style={{
                            flexGrow: 1,
                            display: "grid",
                            gridTemplateColumns: `repeat(${columns.length}, ${cellWidthValue})`,
                            gridTemplateRows: gridRows,
                            height: gridHeight
                        }}
                    >
                        {showGrid && slots.map((slot) => {
                            const selected = selectedRange
                                && selectedRange.start < slot.end
                                && selectedRange.end > slot.start;
                            const handleSelect = onSlotSelect
                                ? (interaction: SyntheticEvent) => onSlotSelect(slot, interaction)
                                : undefined;

                            return (
                                <SlotComponent
                                    key={`${slot.key}-slot`}
                                    className={`time-grid-view_slot${selected ? " is-selected" : ""}`}
                                    timeIndex={slot.timeIndex}
                                    dayIndex={slot.dayIndex}
                                    columnIndex={slot.columnIndex}
                                    step={step}
                                    day={slot.day}
                                    resource={slot.resource}
                                    startTime={slot.start}
                                    endTime={slot.end}
                                    aria-label={`Calendar slot, ${format(slot.start, "EEEE, MMMM do, HH:mm", { locale: calendarLocale })}`}
                                    onClick={handleSelect}
                                    onDragOver={canDropEvents
                                        ? (interaction) => interaction.preventDefault()
                                        : undefined}
                                    onDrop={canDropEvents
                                        ? (interaction) => handleDrop(interaction, slot)
                                        : undefined}
                                    style={{
                                        gridRow: `${(slot.timeIndex * step) + 1} / ${(slot.timeIndex * step) + 1 + slot.duration}`,
                                        gridColumn: slot.columnIndex + 1,
                                        borderTop: showGridLines && slot.timeIndex === 0
                                            ? "var(--border)"
                                            : "none",
                                        borderLeft: showGridLines && slot.columnIndex === 0
                                            ? "var(--border)"
                                            : "none",
                                        borderRight: showGridLines ? "var(--border)" : "none",
                                        borderBottom: showGridLines
                                            ? slot.isDividerBoundary
                                                ? "var(--divider-border)"
                                                : "var(--border)"
                                            : "none"
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
                                        className="time-grid-view_background-event"
                                        event={segment.event}
                                        segment={segment}
                                        dayIndex={segment.dayIndex}
                                        columnIndex={columnIndex}
                                        resource={segment.resource}
                                        style={{
                                            "--color": segment.event.color,
                                            gridColumn: "1 / 2",
                                            gridRow: `${segment.startRow} / ${segment.endRow}`,
                                            ...segment.event.style
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
                                    const resourceId = segment.resource == null
                                        ? undefined
                                        : getResourceId(segment.resource);
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

                                    return (
                                        <EventComponent
                                            key={`${event.id ?? event.title ?? "event"}-${segment.start.getTime()}-${segment.end.getTime()}-${columnIndex}`}
                                            className={`time-grid-view_event${selected ? " is-selected" : ""}`}
                                            event={event}
                                            segment={segment}
                                            dayIndex={segment.dayIndex}
                                            columnIndex={columnIndex}
                                            laneIndex={segment.laneIndex}
                                            laneCount={segment.laneCount}
                                            resource={segment.resource}
                                            resourceId={resourceId}
                                            draggable={draggable}
                                            onDragStart={draggable ? () => setDraggedEvent(segment) : undefined}
                                            onDragEnd={draggable ? () => setDraggedEvent(null) : undefined}
                                            {...interactionProps}
                                            aria-label={[
                                                event.title ?? "Calendar event",
                                                `${format(event.start, "EEEE, MMMM do, HH:mm", { locale: calendarLocale })} to ${format(event.end, "EEEE, MMMM do, HH:mm", { locale: calendarLocale })}`,
                                                event.description
                                            ].filter(Boolean).join(", ")}
                                            style={{
                                                "--color": event.color,
                                                gridColumn: "1 / 2",
                                                gridRow: `${segment.startRow} / ${segment.endRow}`,
                                                overflow: "hidden",
                                                ...getLaneStyle(segment),
                                                ...event.style
                                            }}
                                            titleStyle={event.titleStyle}
                                            descriptionStyle={event.descriptionStyle}
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
