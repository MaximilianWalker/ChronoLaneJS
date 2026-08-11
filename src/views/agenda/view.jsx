"use client";

import { useCallback, useEffect, useMemo } from "react";
import { format, startOfDay } from "date-fns";
import {
    getCalendarRangeBounds,
    moveCalendarDate,
    resolveCalendarRange
} from "../../core/range.js";
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
import AgendaDayHeader from "./day-header.jsx";
import AgendaEmptyState from "./empty-state.jsx";
import AgendaEvent from "./event.jsx";
import "./view.css";

const EMPTY_EVENTS = [];

export default function AgendaView({
    events = EMPTY_EVENTS,
    date,
    defaultDate,
    startDate,
    range = 30,
    navigationStep,
    navigateDate,
    weekStart: weekStartProp,
    minDate,
    maxDate,
    showControls = true,
    locale = defaultCalendarLocale,
    timeZone,
    dayFormat = "EEEE, MMMM do, yyyy",
    headerFormat = "MMMM d, yyyy",
    selectedEventIds = EMPTY_EVENTS,
    eventEditable = false,
    onDateChange,
    onRangeChange,
    onEventClick,
    onSelectEvent,
    onEventEdit,
    eventComponent: EventComponent = AgendaEvent,
    dayHeaderComponent: DayHeaderComponent = AgendaDayHeader,
    emptyComponent: EmptyComponent = AgendaEmptyState,
    navigationButton,
    previousLabel = "Previous agenda range",
    nextLabel = "Next agenda range"
}) {
    const weekStart = resolveCalendarWeekStart(locale, weekStartProp);
    const { anchorDate, setDate } = useCalendarViewDate({
        date,
        defaultDate,
        startDate,
        timeZone,
        onDateChange
    });
    const days = useMemo(() => resolveCalendarRange(range, anchorDate, {
        weekStartsOn: weekStart,
        defaultRange: 30
    }), [anchorDate, range, weekStart]);
    const { start: rangeStart, end: rangeEnd } = getCalendarRangeBounds(days);
    const calendarEvents = useMemo(
        () => normalizeEvents(events, timeZone),
        [events, timeZone]
    );
    const groups = useMemo(() => days.map((day) => ({
        day,
        events: sortEvents(calendarEvents.filter((event) => (
            eventOverlapsDay(event, day)
            && !days.some((previousDay) => (
                previousDay < day && eventOverlapsDay(event, previousDay)
            ))
        )))
    })).filter((group) => group.events.length > 0), [calendarEvents, days]);

    const effectiveNavigationStep = navigationStep
        ?? (range && typeof range === "object" && !Array.isArray(range)
            ? range.navigationStep
            : null)
        ?? Math.max(1, Math.round((rangeEnd - rangeStart) / 86_400_000) + 1);
    const minBoundary = minDate == null
        ? null
        : startOfDay(asCalendarDate(minDate, timeZone));
    const maxBoundary = maxDate == null
        ? null
        : startOfDay(asCalendarDate(maxDate, timeZone));
    const header = `${format(rangeStart, headerFormat, { locale })} – ${format(rangeEnd, headerFormat, { locale })}`;

    const navigate = useCallback((direction) => {
        const nextDate = navigateDate
            ? navigateDate(anchorDate, direction, { days, start: rangeStart, end: rangeEnd })
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

    return (
        <div className="agenda-view" data-time-zone={timeZone}>
            {showControls && (
                <CalendarNavigation
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
            <div className="agenda-view_list">
                {groups.length === 0 && <EmptyComponent />}
                {groups.map((group) => (
                    <section key={group.day.getTime()} className="agenda-view_day">
                        <h3 className="agenda-view_day-heading">
                            <DayHeaderComponent
                                day={group.day}
                                locale={locale}
                                format={dayFormat}
                            />
                        </h3>
                        <div className="agenda-view_day-events">
                            {group.events.map((event) => {
                                const editable = Boolean(onEventEdit)
                                    && (typeof eventEditable === "function"
                                        ? eventEditable(event)
                                        : eventEditable);
                                const hasPrimaryAction = Boolean(onEventClick || onSelectEvent);
                                return (
                                    <EventComponent
                                        key={`${event.id ?? event.title}-${event.start.getTime()}`}
                                        className="agenda-view_event"
                                        event={event}
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
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
