"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
    ComponentType,
    DragEvent,
    DragEventHandler,
    ReactNode,
    SyntheticEvent
} from "react";
import type { Locale } from "date-fns";
import { endOfDay } from "date-fns/endOfDay";
import { format } from "date-fns/format";
import { isSameMonth } from "date-fns/isSameMonth";
import { startOfDay } from "date-fns/startOfDay";

import CalendarNavigation from "../../components/CalendarNavigation.js";
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
    CalendarEventId,
    CalendarStyle,
    NormalizedCalendarEvent
} from "../../types.js";
import Background from "./Background.js";
import ColumnHeader from "./ColumnHeader.js";
import Event from "./Event.js";
import {
    isEventInteractionEnabled,
    moveEventToSlot
} from "./interactions.js";
import { createLayout } from "./layout/createLayout.js";
import {
    getDefaultResourceId,
    getDefaultResourceTitle
} from "./resources.js";
import Slot from "./Slot.js";
import type {
    TimeGridBackgroundEventProps,
    TimeGridColumnHeaderProps,
    TimeGridEventLayout,
    TimeGridEventProps,
    TimeGridLayout,
    TimeGridSlot as TimeGridSlotValue,
    TimeGridSlotProps,
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

interface TimeGridProps<
    Event extends CalendarEvent,
    Resource
> {
    layout: TimeGridLayout<Event, Resource>;
    locale: Locale;
    dayFormat: string;
    step: number;
    headerHeight: number;
    timeLabelWidth: number;
    cellWidth?: number;
    cellHeight: number;
    showGrid: boolean;
    showGridLines: boolean;
    selectedRange?: { start: Date; end: Date };
    selectedEventIds: CalendarEventId[];
    eventDraggable: boolean | ((event: TimeGridEventLayout<Event, Resource>) => boolean);
    eventEditable: boolean | ((event: NormalizedCalendarEvent<Event>) => boolean);
    getResourceId: (resource: Resource) => unknown;
    getResourceTitle: (resource: Resource) => ReactNode;
    SlotComponent: ComponentType<TimeGridSlotProps<Resource>>;
    EventComponent: ComponentType<TimeGridEventProps<Event, Resource>>;
    BackgroundEventComponent: ComponentType<TimeGridBackgroundEventProps<Event, Resource>>;
    ColumnHeaderComponent: ComponentType<TimeGridColumnHeaderProps<Resource>>;
    onEventSelect?: (event: NormalizedCalendarEvent<Event>, interaction: SyntheticEvent) => void;
    onEventEdit?: (event: NormalizedCalendarEvent<Event>, interaction: SyntheticEvent) => void;
    onSlotClick?: (interaction: SyntheticEvent, slot: TimeGridSlotValue<Resource>) => void;
    onSelectSlot?: (slot: TimeGridSlotValue<Resource>, interaction: SyntheticEvent) => void;
    eventDropEnabled: boolean;
    onDrop: (
        interaction: DragEvent<HTMLElement>,
        slot: TimeGridSlotValue<Resource>
    ) => void;
    onDragStart: (event: TimeGridEventLayout<Event, Resource>) => void;
    onDragEnd: DragEventHandler<HTMLElement>;
}

/**
 * Renders the prepared layout and connects its renderer components to the
 * time-grid interactions owned by {@link TimeGridView}.
 *
 * This private component remains in the view module because it is the view's
 * render body rather than a reusable component boundary.
 */
function Grid<
    Event extends CalendarEvent,
    Resource
>({
    layout,
    locale,
    dayFormat,
    step,
    headerHeight,
    timeLabelWidth,
    cellWidth,
    cellHeight,
    showGrid,
    showGridLines,
    selectedRange,
    selectedEventIds,
    eventDraggable,
    eventEditable,
    getResourceId,
    getResourceTitle,
    SlotComponent,
    EventComponent,
    BackgroundEventComponent,
    ColumnHeaderComponent,
    onEventSelect,
    onEventEdit,
    onSlotClick,
    onSelectSlot,
    eventDropEnabled,
    onDrop,
    onDragStart,
    onDragEnd
}: TimeGridProps<Event, Resource>) {
    const {
        columns,
        slots,
        dividers,
        events,
        backgroundEvents,
        totalMinutes
    } = layout;
    const eventsByColumn = useMemo(
        () => groupByColumn(events, columns.length),
        [columns.length, events]
    );
    const backgroundEventsByColumn = useMemo(
        () => groupByColumn(backgroundEvents, columns.length),
        [backgroundEvents, columns.length]
    );
    const headerHeightValue = `${headerHeight}px`;
    const timeLabelWidthValue = `${timeLabelWidth}px`;
    const cellWidthValue = cellWidth
        ? `${cellWidth}px`
        : "minmax(var(--time-grid-day-min-width, 0px), 1fr)";
    const gridHeight = `${(totalMinutes / step) * cellHeight}px`;
    const gridRows = `repeat(${totalMinutes}, minmax(0, 1fr))`;

    return (
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
                            locale={locale}
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
                                {format(time, "HH:mm", { locale })}
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
                        const handleSelect = onSelectSlot || onSlotClick
                            ? (interaction: SyntheticEvent) => {
                                onSelectSlot?.(slot, interaction);
                                onSlotClick?.(interaction, slot);
                            }
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
                                aria-label={`Calendar slot, ${format(slot.start, "EEEE, MMMM do, HH:mm", { locale })}`}
                                onClick={handleSelect}
                                onDragOver={eventDropEnabled
                                    ? (interaction) => interaction.preventDefault()
                                    : undefined}
                                onDrop={eventDropEnabled
                                    ? (interaction) => onDrop(interaction, slot)
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
                            {(backgroundEventsByColumn[columnIndex] ?? []).map((event) => (
                                <BackgroundEventComponent
                                    key={`${event.id ?? "background"}-${event.start.getTime()}-${columnIndex}`}
                                    className="time-grid-view_background-event"
                                    event={event}
                                    dayIndex={event.dayIndex}
                                    columnIndex={columnIndex}
                                    resource={event.resource}
                                    style={{
                                        "--color": event.color,
                                        gridColumn: "1 / 2",
                                        gridRow: `${event.startRow} / ${event.endRow}`,
                                        ...event.style
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
                            {(eventsByColumn[columnIndex] ?? []).map((event) => {
                                const calendarEvent = event as unknown as NormalizedCalendarEvent<Event>;
                                const resourceId = event.resource == null
                                    ? undefined
                                    : getResourceId(event.resource);
                                const draggable = eventDropEnabled
                                    && isEventInteractionEnabled(eventDraggable, event);
                                const editable = Boolean(onEventEdit)
                                    && isEventInteractionEnabled(eventEditable, calendarEvent);
                                const hasPrimaryAction = Boolean(onEventSelect);
                                const selected = event.id != null
                                    && selectedEventIds.includes(event.id);

                                return (
                                    <EventComponent
                                        key={`${event.id ?? event.title ?? "event"}-${event.start.getTime()}-${event.end.getTime()}-${columnIndex}`}
                                        className={`time-grid-view_event${selected ? " is-selected" : ""}`}
                                        event={event}
                                        dayIndex={event.dayIndex}
                                        columnIndex={columnIndex}
                                        laneIndex={event.laneIndex}
                                        laneCount={event.laneCount}
                                        resource={event.resource}
                                        resourceId={resourceId}
                                        draggable={draggable}
                                        onDragStart={draggable ? () => onDragStart(event) : undefined}
                                        onDragEnd={draggable ? onDragEnd : undefined}
                                        onClick={onEventSelect
                                            ? (interaction) => onEventSelect(calendarEvent, interaction)
                                            : undefined}
                                        onDoubleClick={editable
                                            ? (interaction) => onEventEdit?.(calendarEvent, interaction)
                                            : undefined}
                                        onKeyDown={editable
                                            ? (interaction) => {
                                                const shouldEdit = hasPrimaryAction
                                                    ? interaction.shiftKey && interaction.key === "Enter"
                                                    : interaction.key === "Enter";
                                                if (!shouldEdit) return;
                                                interaction.preventDefault();
                                                onEventEdit?.(calendarEvent, interaction);
                                            }
                                            : undefined}
                                        aria-keyshortcuts={editable
                                            ? hasPrimaryAction ? "Shift+Enter" : "Enter"
                                            : undefined}
                                        aria-label={[
                                            event.title ?? "Calendar event",
                                            `${format(event.start, "EEEE, MMMM do, HH:mm", { locale })} to ${format(event.end, "EEEE, MMMM do, HH:mm", { locale })}`,
                                            event.description
                                        ].filter(Boolean).join(", ")}
                                        style={{
                                            "--color": event.color,
                                            gridColumn: "1 / 2",
                                            gridRow: `${event.startRow} / ${event.endRow}`,
                                            overflow: "hidden",
                                            ...getLaneStyle(event),
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
    );
}

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
    startDate: legacyStartDate,
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
    eventDraggable = false,
    eventEditable = false,
    onDateChange,
    onRangeChange,
    onEventSelect,
    onEventEdit,
    onEventDrop,
    onSlotClick,
    onSelectSlot,
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
        startDate: legacyStartDate,
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

        const nextEvent = moveEventToSlot(draggedEvent, slot.start);
        onEventDrop({
            event: draggedEvent,
            start: nextEvent.start,
            end: nextEvent.end,
            nextEvent
        });
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
            <Grid
                layout={layout}
                locale={calendarLocale}
                dayFormat={dayFormat}
                step={step}
                headerHeight={headerHeight}
                timeLabelWidth={timeLabelWidth}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                showGrid={showGrid}
                showGridLines={showGridLines}
                selectedRange={selectedRange}
                selectedEventIds={selectedEventIds}
                eventDraggable={eventDraggable}
                eventEditable={eventEditable}
                getResourceId={getResourceId}
                getResourceTitle={getResourceTitle}
                SlotComponent={SlotComponent}
                EventComponent={EventComponent}
                BackgroundEventComponent={BackgroundEventComponent}
                ColumnHeaderComponent={ColumnHeaderComponent}
                onEventSelect={onEventSelect}
                onEventEdit={onEventEdit}
                onSlotClick={onSlotClick}
                onSelectSlot={onSelectSlot}
                eventDropEnabled={Boolean(onEventDrop)}
                onDrop={handleDrop}
                onDragStart={setDraggedEvent}
                onDragEnd={() => setDraggedEvent(null)}
            />
        </div>
    );
}
