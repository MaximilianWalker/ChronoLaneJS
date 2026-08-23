"use client";

import {
    useCallback,
    useEffect,
    useMemo
} from "react";

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
import { resolveCalendarRange } from "../../core/range.js";
import { useCalendarViewDate } from "../../hooks/useViewDate.js";
import type { CalendarEvent } from "../../types.js";
import Day from "./Day.js";
import DefaultDayHeader from "./DefaultDayHeader.js";
import DefaultEmpty from "./DefaultEmpty.js";
import DefaultEvent from "./DefaultEvent.js";
import { createGroups } from "./layout.js";
import type { ViewProps } from "./types.js";

const EMPTY_EVENTS: never[] = [];
const EMPTY_COMPONENTS = /* @__PURE__ */ Object.freeze({});

/**
 * Renders events grouped by their first visible day within a configurable range.
 *
 * @remarks
 * Multi-day events appear once, under the earliest visible day they overlap.
 * The view supports controlled or uncontrolled navigation, event selection and
 * opening callbacks, locale-aware formatting, and replaceable renderers.
 */
export default function View<Event extends CalendarEvent = CalendarEvent>({
    className,
    style,
    events = EMPTY_EVENTS,
    date,
    defaultDate,
    range = 30,
    weekStart: weekStartProp,
    minDate,
    maxDate,
    showControls = true,
    locale = DEFAULT_CALENDAR_LOCALE,
    formatters = defaultCalendarFormatters,
    messages = defaultCalendarMessages,
    viewName = "agenda",
    timeZone,
    selectedEventIds = EMPTY_EVENTS,
    canSelectEvent,
    canOpenEvent,
    onDateChange,
    onRangeChange,
    onEventSelect,
    onEventOpen,
    eventInteractions,
    components = EMPTY_COMPONENTS
}: ViewProps<Event>) {
    const {
        event: EventRenderer = DefaultEvent,
        dayHeader: DayHeaderRenderer = DefaultDayHeader,
        empty: EmptyRenderer = DefaultEmpty,
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
    const resolvedRange = useMemo(() => resolveCalendarRange(range, anchorDate, {
        weekStartsOn: weekStart,
        defaultRange: 30
    }), [anchorDate, range, weekStart]);
    const { days, start: rangeStart, end: rangeEnd } = resolvedRange;
    const eventCollection = useMemo(
        () => normalizeEventCollection(events, timeZone),
        [events, timeZone]
    );
    const groups = useMemo(
        () => createGroups(days, eventCollection),
        [days, eventCollection]
    );
    const navigationBoundaries = useMemo(
        () => normalizeCalendarNavigationBoundaries(minDate, maxDate, timeZone),
        [maxDate, minDate, timeZone]
    );
    const navigationState = getCalendarNavigationState({
        anchorDate,
        periodStart: rangeStart,
        periodEnd: rangeEnd,
        ...navigationBoundaries
    });
    const calendarRange = { start: rangeStart, end: rangeEnd, days };
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
    const header = formatters.rangeHeader(calendarRange, text.context);

    const navigate = useCallback((direction: -1 | 1) => {
        const nextDate = resolvedRange.navigate(direction);
        setDate(resolveCalendarNavigationDate(
            anchorDate,
            nextDate,
            navigationBoundaries,
            timeZone
        ));
    }, [
        anchorDate,
        navigationBoundaries,
        resolvedRange,
        setDate,
        timeZone
    ]);

    useEffect(() => {
        onRangeChange?.({ start: rangeStart, end: rangeEnd, days });
    }, [days, onRangeChange, rangeEnd, rangeStart]);

    return (
        <div
            className={`agenda-view ${className ?? ""}`.trim()}
            data-time-zone={timeZone}
            style={style}
        >
            {showControls && (
                <CalendarNavigation
                    header={header}
                    onPrevious={() => navigate(-1)}
                    onNext={() => navigate(1)}
                    previousDisabled={navigationState.previousDisabled}
                    nextDisabled={navigationState.nextDisabled}
                    previousLabel={messages.previous(navigationContext)}
                    nextLabel={messages.next(navigationContext)}
                    navigation={NavigationRenderer}
                />
            )}
            <div className="agenda-view_list calendar-scroll-region">
                {groups.length === 0 && (
                    <EmptyRenderer
                        message={messages.agendaEmpty(navigationContext)}
                    />
                )}
                {groups.map((group) => (
                    <Day
                        key={group.day.getTime()}
                        group={group}
                        eventRenderer={EventRenderer}
                        dayHeaderRenderer={DayHeaderRenderer}
                        behavior={behavior}
                        text={text}
                    />
                ))}
            </div>
        </div>
    );
}
