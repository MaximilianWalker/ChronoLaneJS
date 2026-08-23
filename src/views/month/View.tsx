"use client";

import {
    useCallback,
    useEffect,
    useMemo
} from "react";
import { addMonths } from "date-fns/addMonths";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import { endOfMonth } from "date-fns/endOfMonth";
import { endOfWeek } from "date-fns/endOfWeek";
import { startOfDay } from "date-fns/startOfDay";
import { startOfMonth } from "date-fns/startOfMonth";
import { startOfWeek } from "date-fns/startOfWeek";

import CalendarNavigation from "../../components/CalendarNavigation.js";
import type {
    EventBehavior,
    ViewText
} from "../../components/eventPresentation.js";
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
    getCalendarNavigationState,
    normalizeCalendarNavigationBoundaries,
    resolveCalendarNavigationDate
} from "../../core/navigation.js";
import { normalizeCalendarSelectedDate } from "../../core/selection.js";
import { useCalendarViewDate } from "../../hooks/useViewDate.js";
import type { CalendarEvent } from "../../types.js";
import DefaultDayHeader from "./DefaultDayHeader.js";
import DefaultEvent from "./DefaultEvent.js";
import Grid from "./Grid.js";
import { createWeeks } from "./layout.js";
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
    const monthStart = startOfMonth(anchorDate);
    const monthEnd = startOfDay(endOfMonth(anchorDate));
    const rangeStart = startOfWeek(monthStart, { weekStartsOn: weekStart });
    const rangeEnd = startOfDay(endOfWeek(monthEnd, { weekStartsOn: weekStart }));
    const days = useMemo(() => eachDayOfInterval({
        start: rangeStart,
        end: rangeEnd
    }), [rangeEnd, rangeStart]);
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
    const weeks = useMemo(() => createWeeks({
        days,
        events: calendarEvents,
        backgroundEvents: calendarBackgroundEvents
    }), [calendarBackgroundEvents, calendarEvents, days]);
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
            <Grid
                weeks={weeks}
                weekdayHeaders={days.slice(0, 7)}
                anchorDate={anchorDate}
                selectedDate={calendarSelectedDate}
                showOutsideDays={showOutsideDays}
                maxEvents={maxEventsPerDay}
                onSelectDay={onSelectDay}
                onShowMore={onShowMore}
                eventRenderer={EventRenderer}
                headerRenderer={DayHeaderRenderer}
                behavior={behavior}
                text={text}
            />
        </div>
    );
}
