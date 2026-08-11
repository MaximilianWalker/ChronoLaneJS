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
    AgendaDayHeaderProps,
    AgendaEventProps,
    CalendarDateInput,
    CalendarLocale,
    CalendarNavigationButtonProps,
    CalendarProps,
    CalendarStyle,
    MonthDayHeaderProps,
    MonthEventProps,
    SharedViewProps,
    TimeGridColumnHeaderProps,
    TimeGridBackgroundEventProps,
    TimeGridEventProps,
    TimeGridSlotProps
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

/** Provides visible state for selection, editing, and event-drop examples. */
export function InteractionHarness({
    onEventDrop,
    onEventEdit,
    onEventSelect,
    onSlotSelect,
    ...props
}: StoryCalendarProps) {
    const [selectedEventIds, setSelectedEventIds] = useState<Array<string | number>>([]);
    const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date }>();
    const [lastAction, setLastAction] = useState("Choose an event or time slot.");

    return (
        <>
            <p className="story-log" data-testid="interaction-log" aria-live="polite">
                {lastAction}
            </p>
            <Calendar
                {...props}
                selectedEventIds={selectedEventIds}
                selectedRange={selectedRange}
                onEventSelect={(event, interaction) => {
                    if (event.id != null) setSelectedEventIds([event.id]);
                    setLastAction(`Selected ${event.title ?? "event"}`);
                    onEventSelect?.(event, interaction);
                }}
                onSlotSelect={(slot, interaction) => {
                    setSelectedRange({ start: slot.start, end: slot.end });
                    setLastAction(`Selected slot at ${format(slot.start, "HH:mm")}`);
                    onSlotSelect?.(slot, interaction);
                }}
                onEventEdit={(event, interaction) => {
                    setLastAction(`Editing ${event.title ?? "event"}`);
                    onEventEdit?.(event, interaction);
                }}
                onEventDrop={(change) => {
                    setLastAction(`Dropped ${change.event.title ?? "event"} at ${format(change.start, "HH:mm")}`);
                    onEventDrop?.(change);
                }}
            />
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
            minTime="1970-01-01T00:00:00"
            maxTime="1970-01-01T05:00:00"
            step={30}
            dividerInterval={60}
        />
    );
}

/** Default-renderer replacement used by the time-grid customization story. */
export function CustomTimeGridEvent({
    className,
    event,
    onClick,
    onDoubleClick,
    onKeyDown,
    onDragStart,
    onDragEnd,
    draggable,
    style,
    "aria-label": ariaLabel,
    "aria-keyshortcuts": ariaKeyShortcuts
}: TimeGridEventProps<StoryEvent, StoryResource>) {
    const interactive = Boolean(onClick || onDoubleClick);
    const Component: ElementType = interactive ? "button" : "div";

    return (
        <Component
            type={interactive ? "button" : undefined}
            className={`${className} story-event`}
            aria-label={interactive ? ariaLabel : undefined}
            aria-keyshortcuts={ariaKeyShortcuts}
            draggable={draggable}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            style={style}
        >
            <strong>{event.title}</strong>
            <span>{format(event.start, "HH:mm")}–{format(event.end, "HH:mm")}</span>
        </Component>
    );
}

/** Interactive renderer replacement used by the slot customization story. */
export function CustomSlot({
    className,
    onClick,
    onDragOver,
    onDrop,
    style,
    "aria-label": ariaLabel
}: TimeGridSlotProps<StoryResource>) {
    const Component: ElementType = onClick ? "button" : "div";

    return (
        <Component
            type={onClick ? "button" : undefined}
            className={`${className} story-slot`}
            aria-label={onClick ? ariaLabel : undefined}
            onClick={onClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={style}
        />
    );
}

/** Patterned background renderer demonstrating the background-event contract. */
export function CustomBackground({
    className,
    event,
    style
}: TimeGridBackgroundEventProps<StoryEvent, StoryResource>) {
    return (
        <div
            aria-hidden="true"
            className={className}
            data-background-event-id={event.id}
            style={{
                ...style,
                backgroundImage: "repeating-linear-gradient(135deg, transparent 0 8px, rgba(15, 23, 42, 0.08) 8px 16px)"
            }}
        />
    );
}

/** Renderer replacement showing both the calendar day and resource grouping. */
export function CustomColumnHeader({
    day,
    dayFormat,
    locale,
    resource,
    resourceTitle
}: TimeGridColumnHeaderProps<StoryResource>) {
    return (
        <span className="story-header">
            <strong>{format(day, dayFormat, { locale })}</strong>
            {resourceTitle != null && <span>{resource?.group}: {resourceTitle}</span>}
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
    className,
    event,
    locale,
    onClick,
    onDoubleClick,
    onKeyDown,
    editShortcut,
    selected
}: AgendaEventProps<StoryEvent>) {
    const interactive = Boolean(onClick || onDoubleClick);
    const Component: ElementType = interactive ? "button" : "div";

    return (
        <Component
            type={interactive ? "button" : undefined}
            className={`${className} story-event${selected ? " is-selected" : ""}`}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            aria-keyshortcuts={editShortcut}
            style={{ "--color": event.color } as CalendarStyle}
        >
            <strong>{event.title}</strong>
            <span>{format(event.start, "p", { locale })}</span>
        </Component>
    );
}

/** Agenda heading renderer with an explicit short weekday. */
export function CustomAgendaDayHeader({
    day,
    locale,
    format: dayFormat
}: AgendaDayHeaderProps) {
    return (
        <span className="story-header">
            <strong>{format(day, dayFormat, { locale })}</strong>
            <span>{format(day, "EEEE", { locale })}</span>
        </span>
    );
}

/** Compact month renderer demonstrating day-aware event customization. */
export function CustomMonthEvent({
    className,
    event,
    locale,
    onClick,
    onDoubleClick,
    onKeyDown,
    editShortcut,
    selected
}: MonthEventProps<StoryEvent>) {
    const interactive = Boolean(onClick || onDoubleClick);
    const Component: ElementType = interactive ? "button" : "div";

    return (
        <Component
            type={interactive ? "button" : undefined}
            className={`${className} story-event${selected ? " is-selected" : ""}`}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            aria-keyshortcuts={editShortcut}
            style={{ "--color": event.color } as CalendarStyle}
        >
            <strong>{event.title}</strong>
            <span>{format(event.start, "p", { locale })}</span>
        </Component>
    );
}

/** Month heading renderer that visually distinguishes outside days. */
export function CustomMonthDayHeader({
    day,
    locale,
    outsideMonth
}: MonthDayHeaderProps) {
    return (
        <span title={outsideMonth ? "Outside active month" : undefined}>
            {outsideMonth ? "·" : ""}{format(day, "d", { locale })}
        </span>
    );
}

/** Empty-state renderer used by the agenda customization example. */
export function CustomEmptyState() {
    return (
        <div className="story-panel" role="status">
            <strong>The schedule is clear.</strong>
            <p>Add an event or move to another range.</p>
        </div>
    );
}

interface CustomViewProps extends SharedViewProps<StoryEvent> {
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
export function FullyCustomizedWeek(props: StoryCalendarProps) {
    return (
        <WeekView<StoryEvent, StoryResource>
            {...props}
            date={ANCHOR_DATE}
            events={basicEvents}
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
            eventComponent={CustomTimeGridEvent}
            slotComponent={CustomSlot}
            backgroundEventComponent={CustomBackground}
            columnHeaderComponent={CustomColumnHeader}
            navigationButton={CustomNavigationButton}
        />
    );
}

/** Fixed agenda demonstrating all agenda renderer extension points. */
export function FullyCustomizedAgenda(props: StoryCalendarProps) {
    return (
        <AgendaView<StoryEvent>
            {...props}
            date={ANCHOR_DATE}
            events={props.events ?? basicEvents}
            range={14}
            eventComponent={CustomAgendaEvent}
            dayHeaderComponent={CustomAgendaDayHeader}
            emptyComponent={CustomEmptyState}
            navigationButton={CustomNavigationButton}
        />
    );
}

/** Fixed month demonstrating month event and day-header extension points. */
export function FullyCustomizedMonth(props: StoryCalendarProps) {
    return (
        <MonthView<StoryEvent>
            {...props}
            date={ANCHOR_DATE}
            events={props.events ?? monthEvents}
            eventComponent={CustomMonthEvent}
            dayHeaderComponent={CustomMonthDayHeader}
            navigationButton={CustomNavigationButton}
        />
    );
}

/** Root calendar configured with an application-defined registry entry. */
export function CustomViewExample(props: StoryCalendarProps) {
    return (
        <Calendar
            {...props}
            view="quarter"
            events={basicEvents}
            views={{
                quarter: {
                    component: CustomView,
                    defaultProps: { heading: "Launch quarter" }
                }
            }}
        />
    );
}
