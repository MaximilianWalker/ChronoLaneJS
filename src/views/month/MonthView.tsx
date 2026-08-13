"use client";

import { useCallback, useEffect, useMemo } from "react";
import { addMonths } from "date-fns/addMonths";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import { endOfMonth } from "date-fns/endOfMonth";
import { endOfWeek } from "date-fns/endOfWeek";
import { isSameDay } from "date-fns/isSameDay";
import { isSameMonth } from "date-fns/isSameMonth";
import { startOfMonth } from "date-fns/startOfMonth";
import { startOfWeek } from "date-fns/startOfWeek";
import CalendarNavigation from "../../components/CalendarNavigation.js";
import { createEventInteractionProps } from "../../components/eventInteraction.js";
import {
    eventOverlapsDay,
    normalizeEvents,
    sortEvents
} from "../../core/events.js";
import {
    getCalendarNavigationState,
    normalizeCalendarNavigationBoundaries,
    resolveCalendarNavigationDate
} from "../../core/navigation.js";
import { normalizeCalendarSelectedDate } from "../../core/selection.js";
import {
    DEFAULT_CALENDAR_LOCALE,
    readCalendarLocale,
    resolveCalendarWeekStart
} from "../../core/locale.js";
import {
    defaultCalendarFormatters,
    defaultCalendarMessages
} from "../../core/localization.js";
import { useCalendarViewDate } from "../../hooks/useViewDate.js";
import type { CalendarEvent, CalendarStyle } from "../../types.js";
import DayHeader from "./DayHeader.js";
import Event from "./Event.js";
import type { MonthViewProps } from "./types.js";

const EMPTY_EVENTS: never[] = [];
const EMPTY_COMPONENTS = Object.freeze({});

/**
 * Renders a locale-aware month grid with event overflow and outside-day support.
 *
 * @remarks
 * Each event is shown on every day it overlaps, up to `maxEventsPerDay`.
 * Background events decorate day cells while event, header, selection, editing,
 * and navigation behavior remain independently replaceable.
 */
export default function MonthView<Event extends CalendarEvent = CalendarEvent>({
    className,
    style,
    events = EMPTY_EVENTS,
    backgroundEvents = EMPTY_EVENTS,
    date,
    defaultDate,
    weekStart: weekStartProp,
    minDate,
    maxDate,
    showControls = true,
    showOutsideDays = true,
    maxEventsPerDay = 4,
    locale = DEFAULT_CALENDAR_LOCALE,
    formatters = defaultCalendarFormatters,
    messages = defaultCalendarMessages,
    viewName = "month",
    timeZone,
    selectedDate,
    selectedEventIds = EMPTY_EVENTS,
    canEditEvent,
    navigateDate,
    onDateChange,
    onRangeChange,
    onSelectDay,
    onEventSelect,
    onEventEdit,
    onShowMore,
    components = EMPTY_COMPONENTS
}: MonthViewProps<Event>) {
    const {
        event: EventComponent = Event,
        dayHeader: DayHeaderComponent = DayHeader,
        navigation: NavigationComponent
    } = components;
    const calendarLocale = readCalendarLocale(locale);
    const weekStart = resolveCalendarWeekStart(calendarLocale, weekStartProp);
    const { anchorDate, setDate } = useCalendarViewDate({
        date,
        defaultDate,
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
    const calendarSelectedDate = useMemo(
        () => selectedDate == null
            ? null
            : normalizeCalendarSelectedDate(selectedDate, timeZone),
        [selectedDate, timeZone]
    );
    const dayEntries = useMemo(() => days.map((day) => ({
        day,
        events: sortEvents(calendarEvents.filter((event) => eventOverlapsDay(event, day))),
        backgroundEvents: calendarBackgroundEvents.filter(
            (event) => eventOverlapsDay(event, day)
        )
    })), [calendarBackgroundEvents, calendarEvents, days]);
    const weeks = useMemo(() => Array.from(
        { length: Math.ceil(dayEntries.length / 7) },
        (_, index) => dayEntries.slice(index * 7, (index + 1) * 7)
    ), [dayEntries]);
    const navigationBoundaries = useMemo(
        () => normalizeCalendarNavigationBoundaries(minDate, maxDate, timeZone),
        [maxDate, minDate, timeZone]
    );
    const navigationState = getCalendarNavigationState({
        anchorDate,
        periodStart: monthStart,
        periodEnd: monthEnd,
        ...navigationBoundaries
    });
    const calendarRange = { start: rangeStart, end: rangeEnd, days };
    const headerRange = { start: monthStart, end: monthEnd, days };
    const formatContext = { locale: calendarLocale, view: viewName };
    const navigationContext = { view: viewName, range: calendarRange };

    const navigate = useCallback((direction: -1 | 1) => {
        const nextDate = navigateDate
            ? navigateDate(anchorDate, direction, {
                start: rangeStart,
                end: rangeEnd,
                days,
                monthStart,
                monthEnd
            })
            : addMonths(anchorDate, direction);
        setDate(resolveCalendarNavigationDate(
            anchorDate,
            nextDate,
            navigationBoundaries,
            timeZone
        ));
    }, [
        anchorDate,
        days,
        monthEnd,
        monthStart,
        navigateDate,
        navigationBoundaries,
        rangeEnd,
        rangeStart,
        setDate,
        timeZone
    ]);

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
        <div
            className={`month-view ${className ?? ""}`.trim()}
            data-time-zone={timeZone}
            style={style}
        >
            {showControls && (
                <CalendarNavigation
                    header={formatters.rangeHeader(headerRange, formatContext)}
                    onPrevious={() => navigate(-1)}
                    onNext={() => navigate(1)}
                    previousDisabled={navigationState.previousDisabled}
                    nextDisabled={navigationState.nextDisabled}
                    previousLabel={messages.previous(navigationContext)}
                    nextLabel={messages.next(navigationContext)}
                    navigation={NavigationComponent}
                />
            )}
            <div
                className="month-view_grid-wrapper calendar-scroll-region"
                aria-label={messages.monthGridLabel({ view: viewName })}
                tabIndex={0}
            >
                <div className="month-view_grid" role="grid">
                    <div className="month-view_weekdays" role="row">
                        {weekdayHeaders.map((day) => (
                            <div key={`weekday-${day.getDay()}`} className="month-view_weekday" role="columnheader">
                                {formatters.weekday(day, formatContext)}
                            </div>
                        ))}
                    </div>
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="month-view_week" role="row">
                            {week.map(({ day, events: dayEvents, backgroundEvents: dayBackgrounds }) => {
                                const outsideMonth = !isSameMonth(day, anchorDate);
                                const visibleEvents = dayEvents.slice(0, maxEventsPerDay);
                                const hiddenEvents = dayEvents.slice(maxEventsPerDay);
                                const daySelected = calendarSelectedDate
                                    && isSameDay(day, calendarSelectedDate);

                                return (
                                    <div
                                        key={day.getTime()}
                                        className={[
                                            "month-view_day",
                                            outsideMonth ? "is-outside" : "",
                                            daySelected ? "is-selected" : ""
                                        ].filter(Boolean).join(" ")}
                                        role="gridcell"
                                        aria-label={formatters.date(day, formatContext)}
                                    >
                                        {dayBackgrounds.map((event) => (
                                            <div
                                                key={`${event.id ?? "background"}-${day.getTime()}`}
                                                className="month-view_background-event"
                                                style={{ "--color": event.color } as CalendarStyle}
                                            />
                                        ))}
                                        <button
                                            type="button"
                                            className="month-view_day-button"
                                            disabled={!onSelectDay}
                                            onClick={onSelectDay ? (clickEvent) => onSelectDay(day, clickEvent) : undefined}
                                        >
                                            <DayHeaderComponent
                                                day={day}
                                                label={formatters.dayHeader(day, formatContext)}
                                                outsideMonth={outsideMonth}
                                            />
                                        </button>
                                        {(!outsideMonth || showOutsideDays) && (
                                            <div className="month-view_events">
                                                {visibleEvents.map((event) => {
                                                    const interactionProps = createEventInteractionProps({
                                                        event,
                                                        onEventSelect,
                                                        onEventEdit,
                                                        canEditEvent
                                                    });
                                                    const startDate = formatters.date(event.start, formatContext);
                                                    const startTime = formatters.time(event.start, formatContext);
                                                    const endDate = formatters.date(event.end, formatContext);
                                                    const endTime = formatters.time(event.end, formatContext);
                                                    const interactive = interactionProps.onClick != null
                                                        || interactionProps.onDoubleClick != null;
                                                    return (
                                                        <EventComponent
                                                            key={`${event.id ?? event.title}-${event.start.getTime()}-${day.getTime()}`}
                                                            event={event}
                                                            day={day}
                                                            timeLabel={startTime}
                                                            selected={event.id != null && selectedEventIds.includes(event.id)}
                                                            elementProps={{
                                                                className: "month-view_event",
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
                                                                style: { "--color": event.color }
                                                            }}
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
                                                        {messages.moreEvents({
                                                            view: viewName,
                                                            count: hiddenEvents.length,
                                                            date: formatters.date(day, formatContext)
                                                        })}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
