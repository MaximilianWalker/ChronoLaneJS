"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
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
import type { CalendarEvent } from "../../types.js";
import ColumnHeader from "./ColumnHeader.js";
import EventBlock from "./EventBlock.js";
import Grid from "./Grid.js";
import { moveEventToSlot } from "./interactions.js";
import { createLayout } from "./layout/createLayout.js";
import {
    getDefaultResourceId,
    getDefaultResourceTitle
} from "./resources.js";
import SlotCell from "./SlotCell.js";
import TimeRegion from "./TimeRegion.js";
import type {
    TimeGridEventLayout,
    TimeGridSlot as TimeGridSlotValue,
    TimeGridViewProps
} from "./types.js";

const EMPTY_ITEMS: never[] = [];

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
    onEventClick,
    onSelectEvent,
    onEventEdit,
    onEventDrop,
    onSlotClick,
    onSelectSlot,
    getResourceId = getDefaultResourceId,
    getResourceTitle = getDefaultResourceTitle,
    getEventResourceIds,
    slotComponent: SlotComponent = SlotCell,
    eventComponent: EventComponent = EventBlock,
    backgroundEventComponent: BackgroundEventComponent = TimeRegion,
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
                onEventClick={onEventClick}
                onSelectEvent={onSelectEvent}
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
