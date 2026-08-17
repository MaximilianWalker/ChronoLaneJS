import { format } from "date-fns/format";
import { useState } from "react";
import type { ElementType, ReactNode } from "react";

import Calendar, {
    AgendaView,
    DayView,
    MonthView,
    WeekView,
    calendarDateFromTimestamp
} from "../src/index.js";
import type {
    AgendaComponents,
    AgendaDayHeaderProps,
    AgendaEmptyProps,
    AgendaEventProps,
    AgendaViewProps,
    CalendarDateInput,
    CalendarLocale,
    CalendarNavigationButtonProps,
    CalendarProps,
    CalendarSelectionRange,
    MonthComponents,
    MonthDayHeaderProps,
    MonthEventProps,
    MonthViewProps,
    SharedViewProps,
    TimeGridBackgroundEventProps,
    TimeGridComponents,
    TimeGridDayHeaderProps,
    TimeGridEventProps,
    TimeGridResourceHeaderProps,
    TimeGridSlotProps,
    TimeGridViewProps
} from "../src/index.js";
import {
    ANCHOR_DATE,
    DST_START_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents,
    dstEvents,
    monthEvents
} from "./fixtures.js";
import type {
    StoryEvent,
    StoryResource
} from "./fixtures.js";

export type StoryCalendarProps = CalendarProps<StoryEvent, StoryResource>;

/** Concrete root calendar specialization used by typed stories. */
export const StoryCalendar = Calendar<StoryEvent, StoryResource>;

const COMPARISON_LOCALES = ["en-US", "en-GB", "pt-PT", "fr-FR", "ja-JP"];
const COMPARISON_TIME_ZONES = ["Europe/Lisbon", "America/New_York", "Asia/Tokyo"];

/** Demonstrates controlled navigation while exposing the latest anchor date. */
export function ControlledNavigation({
    date: initialDate = ANCHOR_DATE,
    onDateChange,
    ...props
}: StoryCalendarProps) {
    const [date, setDate] = useState<CalendarDateInput>(initialDate);

    return (
        <>
            <p className="story-log" aria-live="polite">
                Controlled anchor: {date instanceof Date
                    ? format(
                        calendarDateFromTimestamp(date.getTime(), props.timeZone),
                        "yyyy-MM-dd"
                    )
                    : String(date)}
            </p>
            <Calendar
                {...props}
                date={date}
                onDateChange={(nextDate) => {
                    setDate(nextDate);
                    onDateChange?.(nextDate);
                }}
            />
        </>
    );
}

/** Provides visible state for selection, opening, drop, and resize examples. */
export function InteractionHarness({
    onEventOpen,
    onEventSelect,
    ...props
}: StoryCalendarProps) {
    const [selectedEventIds, setSelectedEventIds] = useState<Array<string | number>>([]);
    const [selectedRange, setSelectedRange] = useState<CalendarSelectionRange>();
    const [lastAction, setLastAction] = useState("Choose an event or time slot.");

    const handleEventSelect: NonNullable<
        SharedViewProps<StoryEvent, StoryResource>["onEventSelect"]
    > = (
        event,
        interaction,
        context
    ) => {
        if (event.id != null) setSelectedEventIds([event.id]);
        setLastAction(`Selected ${event.title ?? "event"}`);
        onEventSelect?.(event, interaction, context);
    };
    const handleEventOpen: NonNullable<
        SharedViewProps<StoryEvent, StoryResource>["onEventOpen"]
    > = (
        event,
        interaction,
        context
    ) => {
        setLastAction(`Opened ${event.title ?? "event"}`);
        onEventOpen?.(event, interaction, context);
    };
    const calendar = props.view === "agenda" || props.view === "month"
        ? (
            <Calendar
                {...props}
                selectedEventIds={selectedEventIds}
                onEventSelect={handleEventSelect}
                onEventOpen={handleEventOpen}
            />
        )
        : (() => {
            const { onEventDrop, onEventResize, onSlotSelect } = props.viewProps ?? {};
            const handleSlotSelect: NonNullable<
                TimeGridViewProps<StoryEvent, StoryResource>["onSlotSelect"]
            > = (slot, interaction) => {
                setSelectedRange({ start: slot.start, end: slot.end });
                setLastAction(`Selected slot at ${format(slot.start, "HH:mm")}`);
                onSlotSelect?.(slot, interaction);
            };
            const handleEventDrop: NonNullable<
                TimeGridViewProps<StoryEvent, StoryResource>["onEventDrop"]
            > = (change) => {
                setLastAction(`Dropped ${change.event.title ?? "event"} at ${format(change.start, "HH:mm")}`);
                onEventDrop?.(change);
            };
            const handleEventResize: NonNullable<
                TimeGridViewProps<StoryEvent, StoryResource>["onEventResize"]
            > = (change) => {
                setLastAction(
                    `Resized ${change.event.title ?? "event"} to ${format(change.start, "HH:mm")}–${format(change.end, "HH:mm")}`
                );
                onEventResize?.(change);
            };

            return (
                <Calendar
                    {...props}
                    selectedEventIds={selectedEventIds}
                    onEventSelect={handleEventSelect}
                    onEventOpen={handleEventOpen}
                    viewProps={{
                        ...props.viewProps,
                        selectedRange,
                        onSlotSelect: handleSlotSelect,
                        onEventDrop: handleEventDrop,
                        onEventResize: handleEventResize
                    }}
                />
            );
        })();

    return (
        <>
            <p className="story-log" data-testid="interaction-log" aria-live="polite">
                {lastAction}
            </p>
            {calendar}
        </>
    );
}

/** Renders several fixed locales side by side for formatting comparison. */
export function LocaleComparison({
    timeZone = "Europe/Lisbon"
}: {
    locale?: CalendarLocale;
    timeZone?: string;
}) {
    return (
        <div className="story-grid">
            {COMPARISON_LOCALES.map((locale) => (
                <section key={locale} className="story-panel">
                    <h3>{locale}</h3>
                    <DayView
                        date={ANCHOR_DATE}
                        events={basicEvents.slice(0, 2)}
                        locale={locale}
                        timeZone={timeZone}
                        minTime={MIN_TIME}
                        maxTime={MAX_TIME}
                    />
                </section>
            ))}
        </div>
    );
}

/** Renders one schedule in multiple IANA time zones. */
export function TimeZoneComparison({
    locale = "en-US"
}: {
    locale?: CalendarLocale;
    timeZone?: string;
}) {
    return (
        <div className="story-grid">
            {COMPARISON_TIME_ZONES.map((timeZone) => (
                <section key={timeZone} className="story-panel">
                    <h3>{timeZone}</h3>
                    <DayView
                        date={ANCHOR_DATE}
                        events={basicEvents.slice(0, 2)}
                        locale={locale}
                        timeZone={timeZone}
                        minTime={MIN_TIME}
                        maxTime={MAX_TIME}
                    />
                </section>
            ))}
        </div>
    );
}

/** Shows a daylight-saving transition with wall-clock rows kept stable. */
export function DstTransition({
    locale = "en-US",
    timeZone = "Europe/Lisbon"
}: {
    locale?: CalendarLocale;
    timeZone?: string;
}) {
    return (
        <DayView
            date={DST_START_DATE}
            events={dstEvents}
            locale={locale}
            timeZone={timeZone}
            minTime="00:00"
            maxTime="05:00"
            slotDuration={30}
            labelInterval={60}
        />
    );
}

/** Default-renderer replacement used by the time-grid customization story. */
export function CustomTimeGridEvent({
    event,
    segment,
    selected,
    elementProps
}: TimeGridEventProps<StoryEvent, StoryResource>) {
    return (
        <div
            {...elementProps}
            className={`${elementProps.className} story-event${selected ? " is-selected" : ""}`}
            data-story-day={format(segment.day, "yyyy-MM-dd")}
        >
            <strong>{event.title}</strong>
            <span>{format(event.start, "HH:mm")}–{format(event.end, "HH:mm")}</span>
        </div>
    );
}

/** Interactive renderer replacement used by the slot customization story. */
export function CustomSlot({
    slot,
    selected,
    elementProps
}: TimeGridSlotProps<StoryResource>) {
    const interactive = elementProps.onClick != null;
    const Component: ElementType = interactive ? "button" : "div";

    return (
        <Component
            {...elementProps}
            type={interactive ? "button" : undefined}
            className={`${elementProps.className} story-slot${selected ? " is-selected" : ""}`}
            data-story-day={format(slot.day, "yyyy-MM-dd")}
        />
    );
}

/** Patterned background renderer demonstrating the background-event contract. */
export function CustomBackground({
    event,
    segment,
    elementProps
}: TimeGridBackgroundEventProps<StoryEvent, StoryResource>) {
    return (
        <div
            {...elementProps}
            data-background-event-id={event.id}
            data-story-day={format(segment.day, "yyyy-MM-dd")}
            style={{
                ...elementProps.style,
                backgroundImage: "repeating-linear-gradient(135deg, transparent 0 8px, rgba(15, 23, 42, 0.08) 8px 16px)"
            }}
        />
    );
}

/** Renderer replacement for one grouped time-grid day heading. */
export function CustomTimeGridDayHeader({
    columns,
    title
}: TimeGridDayHeaderProps<StoryResource>) {
    return (
        <span className="story-header">
            <strong>{title}</strong>
            <span>{columns.length} column{columns.length === 1 ? "" : "s"}</span>
        </span>
    );
}

/** Renderer replacement for one grouped time-grid resource heading. */
export function CustomTimeGridResourceHeader({
    resource,
    title
}: TimeGridResourceHeaderProps<StoryResource>) {
    return (
        <span className="story-header">
            <strong>{title}</strong>
            <span>{resource.group}</span>
        </span>
    );
}

/** Pill-shaped navigation renderer used across customization examples. */
export function CustomNavigationButton({
    type,
    children,
    ...props
}: CalendarNavigationButtonProps) {
    return (
        <button {...props} type="button" className="story-navigation-button">
            {children ?? (type === "prev" ? "← Earlier" : "Later →")}
        </button>
    );
}

/** Compact agenda renderer demonstrating the public renderer contract. */
export function CustomAgendaEvent({
    event,
    timeLabel,
    selected,
    elementProps
}: AgendaEventProps<StoryEvent>) {
    return (
        <div
            {...elementProps}
            className={`${elementProps.className} story-event${selected ? " is-selected" : ""}`}
        >
            <strong>{event.title}</strong>
            <span>{timeLabel}</span>
        </div>
    );
}

/** Agenda heading renderer demonstrating the prepared-label contract. */
export function CustomAgendaDayHeader({
    label
}: AgendaDayHeaderProps) {
    return (
        <span className="story-header">
            <strong>{label}</strong>
        </span>
    );
}

/** Compact month renderer demonstrating day-aware event customization. */
export function CustomMonthEvent({
    event,
    timeLabel,
    selected,
    elementProps
}: MonthEventProps<StoryEvent>) {
    return (
        <div
            {...elementProps}
            className={`${elementProps.className} story-event${selected ? " is-selected" : ""}`}
        >
            <strong>{event.title}</strong>
            <span>{timeLabel}</span>
        </div>
    );
}

const customTimeGridComponents: TimeGridComponents<StoryEvent, StoryResource> = {
    event: CustomTimeGridEvent,
    slot: CustomSlot,
    backgroundEvent: CustomBackground,
    dayHeader: CustomTimeGridDayHeader,
    resourceHeader: CustomTimeGridResourceHeader,
    navigation: CustomNavigationButton
};

const customAgendaComponents: AgendaComponents<StoryEvent> = {
    event: CustomAgendaEvent,
    dayHeader: CustomAgendaDayHeader,
    empty: CustomEmptyState,
    navigation: CustomNavigationButton
};

const customMonthComponents: MonthComponents<StoryEvent> = {
    event: CustomMonthEvent,
    dayHeader: CustomMonthDayHeader,
    navigation: CustomNavigationButton
};

/** Month heading renderer that visually distinguishes outside days. */
export function CustomMonthDayHeader({
    label,
    outsideMonth
}: MonthDayHeaderProps) {
    return (
        <span title={outsideMonth ? "Outside active month" : undefined}>
            {outsideMonth ? "·" : ""}{label}
        </span>
    );
}

/** Empty-state renderer used by the agenda customization example. */
export function CustomEmptyState({ message }: AgendaEmptyProps) {
    return (
        <div className="story-panel" role="status">
            <strong>The schedule is clear.</strong>
            <p>{message}</p>
        </div>
    );
}

interface CustomViewProps extends SharedViewProps<StoryEvent, StoryResource> {
    heading?: ReactNode;
    viewName?: string;
}

/** Minimal custom view proving that the root registry accepts application views. */
export function CustomView({
    events = [],
    heading = "Quarter overview",
    viewName
}: CustomViewProps) {
    return (
        <section className="story-custom-view">
            <p>Registered as <code>{viewName}</code></p>
            <h2>{heading}</h2>
            <p>{events.length} events were passed through the shared calendar contract.</p>
        </section>
    );
}

/** Fixed week used to demonstrate customized renderers without inline components. */
export function FullyCustomizedWeek(
    props: TimeGridViewProps<StoryEvent, StoryResource>
) {
    return (
        <WeekView<StoryEvent, StoryResource>
            {...props}
            date={ANCHOR_DATE}
            events={basicEvents}
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
            components={customTimeGridComponents}
        />
    );
}

/** Fixed agenda demonstrating all agenda renderer extension points. */
export function FullyCustomizedAgenda(props: AgendaViewProps<StoryEvent>) {
    return (
        <AgendaView<StoryEvent>
            {...props}
            date={ANCHOR_DATE}
            events={props.events ?? basicEvents}
            range={14}
            components={customAgendaComponents}
        />
    );
}

/** Fixed month demonstrating month event and day-header extension points. */
export function FullyCustomizedMonth(props: MonthViewProps<StoryEvent>) {
    return (
        <MonthView<StoryEvent>
            {...props}
            date={ANCHOR_DATE}
            events={props.events ?? monthEvents}
            components={customMonthComponents}
        />
    );
}

/** Root calendar configured with an application-defined registry entry. */
export function CustomViewExample({
    events = basicEvents,
    ...props
}: Omit<SharedViewProps<StoryEvent, StoryResource>, "viewName">) {
    return (
        <Calendar
            {...props}
            view="quarter"
            events={events}
            views={{
                quarter: {
                    component: CustomView,
                    defaultProps: { heading: "Launch quarter" }
                }
            }}
        />
    );
}
