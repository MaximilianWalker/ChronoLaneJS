"use client";

import { useCallback, useEffect, useMemo } from "react";
import { format } from "date-fns/format";
import { startOfDay } from "date-fns/startOfDay";
import {
    getCalendarRangeBounds,
    moveCalendarDate,
    resolveCalendarRange
} from "../../core/range.js";
import CalendarNavigation from "../../components/CalendarNavigation.js";
import { asCalendarDate } from "../../core/date.js";
import {
    eventOverlapsDay,
    normalizeEvents,
    sortEvents
} from "../../core/events.js";
import {
    DEFAULT_CALENDAR_LOCALE,
    readCalendarLocale,
    resolveCalendarWeekStart
} from "../../core/locale.js";
import { useCalendarViewDate } from "../../hooks/useViewDate.js";
import type { CalendarEvent } from "../../types.js";
import DayHeader from "./DayHeader.js";
import EmptyState from "./EmptyState.js";
import Event from "./Event.js";
import type { AgendaViewProps } from "./types.js";

const EMPTY_EVENTS: never[] = [];

/**
 * Renders events grouped by their first visible day within a configurable range.
 *
 * @remarks
 * Multi-day events appear once, under the earliest visible day they overlap.
 * The view supports controlled or uncontrolled navigation, event selection and
 * editing callbacks, locale-aware formatting, and replaceable renderers.
 */
export default function AgendaView<Event extends CalendarEvent = CalendarEvent>({
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
    locale = DEFAULT_CALENDAR_LOCALE,
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
    eventComponent: EventComponent = Event,
    dayHeaderComponent: DayHeaderComponent = DayHeader,
    emptyComponent: EmptyComponent = EmptyState,
    navigationButton,
    previousLabel = "Previous agenda range",
    nextLabel = "Next agenda range"
}: AgendaViewProps<Event>) {
    const calendarLocale = readCalendarLocale(locale);
    const weekStart = resolveCalendarWeekStart(calendarLocale, weekStartProp);
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
        ?? Math.max(1, Math.round(
            (rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000
        ) + 1);
    const minBoundary = minDate == null
        ? null
        : startOfDay(asCalendarDate(minDate, timeZone));
    const maxBoundary = maxDate == null
        ? null
        : startOfDay(asCalendarDate(maxDate, timeZone));
    const header = `${format(rangeStart, headerFormat, { locale: calendarLocale })} – ${format(rangeEnd, headerFormat, { locale: calendarLocale })}`;

    const navigate = useCallback((direction: -1 | 1) => {
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
                                locale={calendarLocale}
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
                                        locale={calendarLocale}
                                        selected={event.id != null && selectedEventIds.includes(event.id)}
                                        onClick={onEventClick || onSelectEvent
                                            ? (clickEvent) => {
                                                onSelectEvent?.(event, clickEvent);
                                                onEventClick?.(clickEvent, event);
                                            }
                                            : undefined}
                                        onDoubleClick={editable
                                            ? (editEvent) => onEventEdit?.(event, editEvent)
                                            : undefined}
                                        onKeyDown={editable
                                            ? (keyEvent) => {
                                                const shouldEdit = hasPrimaryAction
                                                    ? keyEvent.shiftKey && keyEvent.key === "Enter"
                                                    : keyEvent.key === "Enter";
                                                if (!shouldEdit) return;
                                                keyEvent.preventDefault();
                                                onEventEdit?.(event, keyEvent);
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
