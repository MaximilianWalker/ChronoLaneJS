"use client";

import {
    useCallback,
    useEffect,
    useMemo
} from "react";
import { addMonths } from "date-fns/addMonths";

import CalendarNavigation from "../../components/CalendarNavigation.js";
import type {
    EventBehavior,
    ViewText
} from "../../components/eventPresentation.js";
import { normalizeEventCollection } from "../../core/events.js";
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
    getCalendarNavigationState,
    normalizeCalendarNavigationBoundaries,
    resolveCalendarNavigationDate
} from "../../core/navigation.js";
import { normalizeCalendarSelectedDate } from "../../core/selection.js";
import { useCalendarViewDate } from "../../hooks/useViewDate.js";
import type { CalendarEvent } from "../../types.js";
import Day from "./Day.js";
import DefaultDayHeader from "./DefaultDayHeader.js";
import DefaultEvent from "./DefaultEvent.js";
import { createLayout } from "./layout.js";
import type { ViewProps } from "./types.js";

const EMPTY_EVENTS: never[] = [];
const EMPTY_COMPONENTS = /* @__PURE__ */ Object.freeze({});

/**
 * Renders a locale-aware month grid with event overflow and outside-day support.
 *
 * @remarks
 * Each event is shown on every day it overlaps, up to `maxEventsPerDay`.
 * Background events decorate day cells while event, header, selection, opening,
 * and navigation behavior remain independently replaceable.
 */
export default function View<Event extends CalendarEvent = CalendarEvent>({
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
    canSelectEvent,
    canOpenEvent,
    onDateChange,
    onRangeChange,
    onSelectDay,
    onEventSelect,
    onEventOpen,
    eventInteractions,
    onShowMore,
    components = EMPTY_COMPONENTS
}: ViewProps<Event>) {
    const {
        event: EventRenderer = DefaultEvent,
        dayHeader: DayHeaderRenderer = DefaultDayHeader,
        navigation: NavigationRenderer
    } = components;
    const calendarLocale = readCalendarLocale(locale);
    const weekStart = resolveCalendarWeekStart(calendarLocale, weekStartProp);
    const { anchorDate, setDate } = useCalendarViewDate({
        date,
        defaultDate,
        timeZone,
        onDateChange
    });
    const eventCollection = useMemo(
        () => normalizeEventCollection(events, timeZone),
        [events, timeZone]
    );
    const backgroundEventCollection = useMemo(
        () => normalizeEventCollection(backgroundEvents, timeZone),
        [backgroundEvents, timeZone]
    );
    const calendarSelectedDate = useMemo(
        () => selectedDate == null
            ? null
            : normalizeCalendarSelectedDate(selectedDate, timeZone),
        [selectedDate, timeZone]
    );
    const overflowEnabled = onShowMore != null;
    const layout = useMemo(() => createLayout({
        anchorDate,
        weekStartsOn: weekStart,
        events: eventCollection,
        backgroundEvents: backgroundEventCollection,
        selectedDate: calendarSelectedDate,
        showOutsideDays,
        maxEventsPerDay,
        overflowEnabled
    }), [
        anchorDate,
        backgroundEventCollection,
        calendarSelectedDate,
        eventCollection,
        maxEventsPerDay,
        overflowEnabled,
        showOutsideDays,
        weekStart
    ]);
    const {
        monthStart,
        monthEnd,
        rangeStart,
        rangeEnd,
        days
    } = layout;
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
    const text: ViewText = {
        formatters,
        messages,
        context: { locale: calendarLocale, view: viewName }
    };
    const behavior: EventBehavior<Event, never> = {
        selectedIds: selectedEventIds,
        canSelect: canSelectEvent,
        canOpen: canOpenEvent,
        onSelect: onEventSelect,
        onOpen: onEventOpen,
        interactions: eventInteractions
    };
    const navigationContext = { view: viewName, range: calendarRange };

    const navigate = useCallback((direction: -1 | 1) => {
        const nextDate = addMonths(anchorDate, direction);
        setDate(resolveCalendarNavigationDate(
            anchorDate,
            nextDate,
            navigationBoundaries,
            timeZone
        ));
    }, [anchorDate, navigationBoundaries, setDate, timeZone]);

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
                    header={formatters.rangeHeader(headerRange, text.context)}
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
                className="month-view_grid-wrapper calendar-scroll-region"
                aria-label={messages.monthGridLabel({ view: viewName })}
                tabIndex={0}
            >
                <div className="month-view_grid" role="grid">
                    <div className="month-view_weekdays" role="row">
                        {layout.weekdayHeaders.map(({ key, day }) => (
                            <div
                                key={key}
                                className="month-view_weekday"
                                role="columnheader"
                            >
                                {formatters.weekday(day, text.context)}
                            </div>
                        ))}
                    </div>
                    {layout.weeks.map((week) => (
                        <div
                            key={week.key}
                            className="month-view_week"
                            role="row"
                        >
                            {week.days.map((entry) => (
                                <Day
                                    key={entry.key}
                                    entry={entry}
                                    onSelect={onSelectDay}
                                    onShowMore={onShowMore}
                                    eventRenderer={EventRenderer}
                                    dayHeaderRenderer={DayHeaderRenderer}
                                    behavior={behavior}
                                    text={text}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
