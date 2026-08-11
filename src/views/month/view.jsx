"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    startOfDay,
    startOfMonth,
    startOfWeek
} from "date-fns";
import CalendarNavigation from "../../components/navigation.jsx";
import { asCalendarDate } from "../../core/date.js";
import {
    eventOverlapsDay,
    normalizeEvents,
    sortEvents
} from "../../core/events.js";
import {
    defaultCalendarLocale,
    resolveCalendarWeekStart
} from "../../core/locale.js";
import { useCalendarViewDate } from "../../hooks/use-view-date.js";
import MonthDayHeader from "./day-header.jsx";
import MonthEvent from "./event.jsx";
import "./view.css";

const EMPTY_EVENTS = [];

export default function MonthView({
    events = EMPTY_EVENTS,
    backgroundEvents = EMPTY_EVENTS,
    date,
    defaultDate,
    startDate,
    weekStart: weekStartProp,
    minDate,
    maxDate,
    showControls = true,
    showOutsideDays = true,
    maxEventsPerDay = 4,
    locale = defaultCalendarLocale,
    timeZone,
    headerFormat = "MMMM yyyy",
    weekdayFormat = "EEE",
    selectedDate,
    selectedEventIds = EMPTY_EVENTS,
    eventEditable = false,
    navigateDate,
    onDateChange,
    onRangeChange,
    onSelectDay,
    onEventClick,
    onSelectEvent,
    onEventEdit,
    onShowMore,
    eventComponent: EventComponent = MonthEvent,
    dayHeaderComponent: DayHeaderComponent = MonthDayHeader,
    navigationButton,
    previousLabel = "Previous month",
    nextLabel = "Next month"
}) {
    const weekStart = resolveCalendarWeekStart(locale, weekStartProp);
    const { anchorDate, setDate } = useCalendarViewDate({
        date,
        defaultDate,
        startDate,
        timeZone,
        onDateChange
    });
    const monthStart = startOfMonth(anchorDate);
    const monthEnd = endOfMonth(anchorDate);
    const rangeStart = startOfWeek(monthStart, { weekStartsOn: weekStart });
    const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: weekStart });
    const days = useMemo(() => eachDayOfInterval({
        start: rangeStart,
        end: rangeEnd
    }), [rangeEnd, rangeStart]);
    const weekdayHeaders = days.slice(0, 7);
    const calendarEvents = useMemo(
        () => normalizeEvents(events, timeZone),
        [events, timeZone]
    );
    const calendarBackgroundEvents = useMemo(
        () => normalizeEvents(backgroundEvents, timeZone),
        [backgroundEvents, timeZone]
    );
    const dayEntries = useMemo(() => days.map((day) => ({
        day,
        events: sortEvents(calendarEvents.filter((event) => eventOverlapsDay(event, day))),
        backgroundEvents: calendarBackgroundEvents.filter(
            (event) => eventOverlapsDay(event, day)
        )
    })), [calendarBackgroundEvents, calendarEvents, days]);
    const minBoundary = minDate == null
        ? null
        : startOfDay(asCalendarDate(minDate, timeZone));
    const maxBoundary = maxDate == null
        ? null
        : startOfDay(asCalendarDate(maxDate, timeZone));

    const navigate = useCallback((direction) => {
        const nextDate = navigateDate
            ? navigateDate(anchorDate, direction, {
                start: rangeStart,
                end: rangeEnd,
                monthStart,
                monthEnd
            })
            : addMonths(anchorDate, direction);
        setDate(nextDate);
    }, [anchorDate, monthEnd, monthStart, navigateDate, rangeEnd, rangeStart, setDate]);

    useEffect(() => {
        onRangeChange?.({
            start: rangeStart,
            end: rangeEnd,
            days,
            monthStart,
            monthEnd
        });
    }, [days, monthEnd, monthStart, onRangeChange, rangeEnd, rangeStart]);

    return (
        <div className="month-view" data-time-zone={timeZone}>
            {showControls && (
                <CalendarNavigation
                    header={format(anchorDate, headerFormat, { locale })}
                    onPrevious={() => navigate(-1)}
                    onNext={() => navigate(1)}
                    previousDisabled={Boolean(minBoundary && monthStart <= minBoundary)}
                    nextDisabled={Boolean(maxBoundary && monthEnd >= maxBoundary)}
                    previousLabel={previousLabel}
                    nextLabel={nextLabel}
                    navigationButton={navigationButton}
                />
            )}
            <div className="month-view_grid-wrapper">
                <div className="month-view_grid" role="grid">
                    {weekdayHeaders.map((day) => (
                        <div key={`weekday-${day.getDay()}`} className="month-view_weekday" role="columnheader">
                            {format(day, weekdayFormat, { locale })}
                        </div>
                    ))}
                    {dayEntries.map(({ day, events: dayEvents, backgroundEvents: dayBackgrounds }) => {
                        const outsideMonth = !isSameMonth(day, anchorDate);
                        const visibleEvents = dayEvents.slice(0, maxEventsPerDay);
                        const hiddenEvents = dayEvents.slice(maxEventsPerDay);
                        const daySelected = selectedDate
                            && isSameDay(day, asCalendarDate(selectedDate, timeZone));

                        return (
                            <div
                                key={day.getTime()}
                                className={[
                                    "month-view_day",
                                    outsideMonth ? "is-outside" : "",
                                    daySelected ? "is-selected" : ""
                                ].filter(Boolean).join(" ")}
                                role="gridcell"
                                aria-label={format(day, "EEEE, MMMM do, yyyy", { locale })}
                            >
                                {dayBackgrounds.map((event) => (
                                    <div
                                        key={`${event.id ?? "background"}-${day.getTime()}`}
                                        className="month-view_background-event"
                                        style={{ "--color": event.color }}
                                    />
                                ))}
                                <button
                                    type="button"
                                    className="month-view_day-button"
                                    disabled={!onSelectDay}
                                    onClick={onSelectDay ? (clickEvent) => onSelectDay(day, clickEvent) : undefined}
                                >
                                    <DayHeaderComponent day={day} locale={locale} outsideMonth={outsideMonth} />
                                </button>
                                {(!outsideMonth || showOutsideDays) && (
                                    <div className="month-view_events">
                                        {visibleEvents.map((event) => {
                                            const editable = Boolean(onEventEdit)
                                                && (typeof eventEditable === "function"
                                                    ? eventEditable(event)
                                                    : eventEditable);
                                            const hasPrimaryAction = Boolean(onEventClick || onSelectEvent);
                                            return (
                                                <EventComponent
                                                    key={`${event.id ?? event.title}-${event.start.getTime()}-${day.getTime()}`}
                                                    className="month-view_event"
                                                    event={event}
                                                    day={day}
                                                    locale={locale}
                                                    selected={selectedEventIds.includes(event.id)}
                                                    onClick={onEventClick || onSelectEvent
                                                        ? (clickEvent) => {
                                                            onSelectEvent?.(event, clickEvent);
                                                            onEventClick?.(clickEvent, event);
                                                        }
                                                        : undefined}
                                                    onDoubleClick={editable
                                                        ? (editEvent) => onEventEdit(event, editEvent)
                                                        : undefined}
                                                    onKeyDown={editable
                                                        ? (keyEvent) => {
                                                            const shouldEdit = hasPrimaryAction
                                                                ? keyEvent.shiftKey && keyEvent.key === "Enter"
                                                                : keyEvent.key === "Enter";
                                                            if (!shouldEdit) return;
                                                            keyEvent.preventDefault();
                                                            onEventEdit(event, keyEvent);
                                                        }
                                                        : undefined}
                                                    editShortcut={editable
                                                        ? hasPrimaryAction ? "Shift+Enter" : "Enter"
                                                        : undefined}
                                                />
                                            );
                                        })}
                                        {hiddenEvents.length > 0 && (
                                            <button
                                                type="button"
                                                className="month-view_more"
                                                onClick={(clickEvent) => onShowMore?.({
                                                    day,
                                                    events: dayEvents
                                                }, clickEvent)}
                                            >
                                                +{hiddenEvents.length} more
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
