"use client";

import { useCallback, useEffect, useMemo } from "react";
import { resolveCalendarRange } from "../../core/range.js";
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
import type { CalendarEvent } from "../../types.js";
import DayHeader from "./DayHeader.js";
import EmptyState from "./EmptyState.js";
import Event from "./Event.js";
import type { AgendaViewProps } from "./types.js";

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
export default function AgendaView<Event extends CalendarEvent = CalendarEvent>({
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
}: AgendaViewProps<Event>) {
    const {
        event: EventComponent = Event,
        dayHeader: DayHeaderComponent = DayHeader,
        empty: EmptyComponent = EmptyState,
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
    const resolvedRange = useMemo(() => resolveCalendarRange(range, anchorDate, {
        weekStartsOn: weekStart,
        defaultRange: 30
    }), [anchorDate, range, weekStart]);
    const { days, start: rangeStart, end: rangeEnd } = resolvedRange;
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
    const formatContext = { locale: calendarLocale, view: viewName };
    const navigationContext = { view: viewName, range: calendarRange };
    const header = formatters.rangeHeader(calendarRange, formatContext);

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
                    navigation={NavigationComponent}
                />
            )}
            <div className="agenda-view_list calendar-scroll-region">
                {groups.length === 0 && (
                    <EmptyComponent message={messages.agendaEmpty(navigationContext)} />
                )}
                {groups.map((group) => (
                    <section key={group.day.getTime()} className="agenda-view_day">
                        <h3 className="agenda-view_day-heading">
                            <DayHeaderComponent
                                day={group.day}
                                label={formatters.dayHeader(group.day, formatContext)}
                            />
                        </h3>
                        <div className="agenda-view_day-events">
                            {group.events.map((event) => {
                                const interactionContext = {
                                    view: viewName,
                                    occurrence: {
                                        day: group.day,
                                        resource: null,
                                        resourceId: null
                                    }
                                };
                                const interactionProps = createEventInteractionProps({
                                    event,
                                    context: interactionContext,
                                    canSelectEvent,
                                    canOpenEvent,
                                    onEventSelect,
                                    onEventOpen,
                                    eventInteractions
                                });
                                const startDate = formatters.date(event.start, formatContext);
                                const startTime = formatters.time(event.start, formatContext);
                                const endDate = formatters.date(event.end, formatContext);
                                const endTime = formatters.time(event.end, formatContext);
                                const interactive = interactionProps.onClick != null
                                    || interactionProps.onDoubleClick != null
                                    || interactionProps.onContextMenu != null
                                    || interactionProps.onKeyDown != null;
                                return (
                                    <EventComponent
                                        key={`${event.id ?? event.title}-${event.start.getTime()}`}
                                        event={event}
                                        timeLabel={messages.timeRange({
                                            view: viewName,
                                            startTime,
                                            endTime
                                        })}
                                        selected={event.id != null && selectedEventIds.includes(event.id)}
                                        elementProps={{
                                            className: "agenda-view_event",
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
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
