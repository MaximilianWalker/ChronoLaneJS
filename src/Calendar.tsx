"use client";

import { Suspense } from "react";
import type {
    CSSProperties,
    ElementType,
    ReactElement,
    ReactNode
} from "react";
import {
    DEFAULT_CALENDAR_LOCALE,
    readCalendarLocale
} from "./core/locale.js";
import {
    defaultCalendarFormatters,
    defaultCalendarMessages
} from "./core/localization.js";
import { defaultCalendarViews } from "./viewRegistry.js";
import type {
    CalendarEvent,
    CalendarFormatters,
    CalendarLocale,
    CalendarMessages,
    CalendarRangeDefinition,
    CalendarViewDefinition,
    SharedViewProps
} from "./types.js";
import type { TimeGridViewProps } from "./views/time-grid/types.js";

const EMPTY_EVENTS: never[] = [];
const EMPTY_PROPS = Object.freeze({});
const EMPTY_VIEWS = Object.freeze({});

/** Props accepted by the root {@link Calendar} component. */
export interface CalendarProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> extends SharedViewProps<Event> {
    className?: string;
    style?: CSSProperties;
    view?: string;
    views?: Record<string, ElementType | CalendarViewDefinition>;
    viewProps?: Record<string, unknown>;
    locale?: CalendarLocale;
    localeFallback?: ReactNode;
    resources?: Resource[];
    range?: CalendarRangeDefinition;
    minTime?: TimeGridViewProps<Event, Resource>["minTime"];
    maxTime?: TimeGridViewProps<Event, Resource>["maxTime"];
    slotDuration?: number;
    labelInterval?: number;
    headerHeight?: number;
    timeLabelWidth?: number;
    cellWidth?: number;
    cellHeight?: number;
    showGridLines?: boolean;
    weekStart?: TimeGridViewProps<Event, Resource>["weekStart"];
    selectedRange?: { start: Date; end: Date };
    canDragEvent?: TimeGridViewProps<Event, Resource>["canDragEvent"];
    onEventDrop?: TimeGridViewProps<Event, Resource>["onEventDrop"];
    onSlotSelect?: TimeGridViewProps<Event, Resource>["onSlotSelect"];
    getResourceId?: TimeGridViewProps<Event, Resource>["getResourceId"];
    getResourceTitle?: TimeGridViewProps<Event, Resource>["getResourceTitle"];
    getEventResourceIds?: TimeGridViewProps<Event, Resource>["getEventResourceIds"];
    [key: string]: unknown;
}

interface ResolvedCalendarViewProps<Event extends CalendarEvent> {
    ViewComponent: ElementType;
    locale: CalendarLocale;
    formatters: CalendarFormatters;
    messages: CalendarMessages;
    sharedProps: Record<string, unknown>;
    defaultViewProps: Record<string, unknown>;
    viewProps: Record<string, unknown>;
    events: Event[];
    backgroundEvents: Event[];
    view: string;
}

/**
 * Resolves a locale inside `Suspense` and applies the ordered prop layers to a
 * registered view component.
 */
const ResolvedCalendarView = <Event extends CalendarEvent>({
    ViewComponent,
    locale,
    formatters,
    messages,
    sharedProps,
    defaultViewProps,
    viewProps,
    events,
    backgroundEvents,
    view
}: ResolvedCalendarViewProps<Event>) => (
    <ViewComponent
        {...sharedProps}
        {...defaultViewProps}
        {...viewProps}
        locale={readCalendarLocale(locale)}
        formatters={formatters}
        messages={messages}
        events={events}
        backgroundEvents={backgroundEvents}
        viewName={view}
    />
);

/** Distinguishes a view registration with defaults from a bare component. */
const isViewDefinition = (
    value: ElementType | CalendarViewDefinition
): value is CalendarViewDefinition => (
    typeof value === "object" && value !== null && "component" in value
);

/**
 * Renders the selected calendar view from the built-in and caller-provided
 * view registries.
 *
 * @remarks
 * Caller-provided views override built-ins with the same name. View props are
 * merged in this order: shared calendar props, registered defaults, explicit
 * `viewProps`, and finally events, the resolved locale, and the root
 * localization registries. Named locales may suspend while their date-fns
 * module loads.
 *
 * @throws Error if the requested view is not registered.
 */
export default function Calendar<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
>({
    className,
    style,
    view = "week",
    views = EMPTY_VIEWS,
    viewProps = EMPTY_PROPS,
    events = EMPTY_EVENTS,
    backgroundEvents = EMPTY_EVENTS,
    locale = DEFAULT_CALENDAR_LOCALE,
    formatters = defaultCalendarFormatters,
    messages = defaultCalendarMessages,
    localeFallback = null,
    ...sharedProps
}: CalendarProps<Event, Resource>): ReactElement {
    const viewDefinition = views[view] ?? defaultCalendarViews[view];
    if (!viewDefinition) {
        throw new Error(`Calendar view "${view}" is not registered.`);
    }

    const ViewComponent = isViewDefinition(viewDefinition)
        ? viewDefinition.component
        : viewDefinition;
    const defaultViewProps = isViewDefinition(viewDefinition)
        ? viewDefinition.defaultProps ?? EMPTY_PROPS
        : EMPTY_PROPS;

    return (
        <div
            className={`calendar ${className ?? ""}`.trim()}
            data-calendar-view={view}
            style={style}
        >
            <Suspense fallback={localeFallback as ReactNode}>
                <ResolvedCalendarView
                    ViewComponent={ViewComponent}
                    locale={locale}
                    formatters={formatters}
                    messages={messages}
                    sharedProps={sharedProps}
                    defaultViewProps={defaultViewProps}
                    viewProps={viewProps}
                    events={events}
                    backgroundEvents={backgroundEvents}
                    view={view}
                />
            </Suspense>
        </div>
    );
}
