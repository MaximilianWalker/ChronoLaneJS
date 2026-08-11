"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    endOfDay,
    format,
    isSameMonth,
    startOfDay
} from "date-fns";

import CalendarNavigation from "../../components/navigation.jsx";
import { asCalendarDate } from "../../core/date.js";
import { normalizeEvents } from "../../core/events.js";
import {
    defaultCalendarLocale,
    resolveCalendarWeekStart
} from "../../core/locale.js";
import {
    getCalendarRangeBounds,
    moveCalendarDate,
    resolveCalendarRange
} from "../../core/range.js";
import { useCalendarViewDate } from "../../hooks/use-view-date.js";
import TimeGridBackgroundEvent from "./components/background-event.jsx";
import TimeGridColumnHeader from "./components/column-header.jsx";
import TimeGridEvent from "./components/event.jsx";
import TimeGridSlot from "./components/slot.jsx";
import { moveTimeGridEvent } from "./event-drop.js";
import TimeGrid from "./grid.jsx";
import { createTimeGridLayout } from "./layout.js";
import "./view.css";

const EMPTY_ITEMS = [];
const DEFAULT_GET_RESOURCE_ID = (resource) => resource?.id;
const DEFAULT_GET_RESOURCE_TITLE = (resource) => (
    resource?.title ?? resource?.name ?? resource?.id
);

export default function TimeGridView({
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
    locale = defaultCalendarLocale,
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
    getResourceId = DEFAULT_GET_RESOURCE_ID,
    getResourceTitle = DEFAULT_GET_RESOURCE_TITLE,
    getEventResourceIds,
    slotComponent: SlotComponent = TimeGridSlot,
    eventComponent: EventComponent = TimeGridEvent,
    backgroundEventComponent: BackgroundEventComponent = TimeGridBackgroundEvent,
    columnHeaderComponent: ColumnHeaderComponent = TimeGridColumnHeader,
    navigationButton,
    previousLabel = "Previous range",
    nextLabel = "Next range"
}) {
    const [draggedEvent, setDraggedEvent] = useState(null);
    const weekStart = resolveCalendarWeekStart(locale, weekStartProp);
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
    const layout = useMemo(() => createTimeGridLayout({
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

    const firstHeaderDate = format(rangeStart, headerFormat, { locale });
    const secondHeaderDate = format(rangeEnd, headerFormat, { locale });
    const defaultHeader = isSameMonth(rangeStart, rangeEnd)
        ? firstHeaderDate
        : `${firstHeaderDate} - ${secondHeaderDate}`;
    const header = formatHeader
        ? formatHeader({ start: rangeStart, end: rangeEnd, days, locale })
        : defaultHeader;
    const effectiveNavigationStep = navigationStep
        ?? (range && typeof range === "object" && !Array.isArray(range)
            ? range.navigationStep
            : null)
        ?? Math.max(1, Math.round((rangeEnd - rangeStart) / 86_400_000) + 1);
    const minBoundary = calendarMinDate && startOfDay(calendarMinDate);
    const maxBoundary = calendarMaxDate && startOfDay(calendarMaxDate);

    const navigate = useCallback((direction) => {
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

    const handleDrop = useCallback((event, slot) => {
        event.preventDefault();
        if (!draggedEvent || !onEventDrop) return;

        const nextEvent = moveTimeGridEvent(draggedEvent, slot.start);
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
            <TimeGrid
                layout={layout}
                locale={locale}
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
