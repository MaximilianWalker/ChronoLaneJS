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
import { defaultCalendarViews } from "./viewRegistry.js";
import type {
    CalendarDateInput,
    CalendarEvent,
    CalendarLocale,
    CalendarRangeDefinition,
    CalendarViewDefinition,
    SharedViewProps
} from "./types.js";
import type { TimeGridViewProps } from "./views/time-grid/types.js";

const EMPTY_EVENTS: never[] = [];
const EMPTY_PROPS = Object.freeze({});
const EMPTY_VIEWS = Object.freeze({});

export interface CalendarProps<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> extends SharedViewProps<Event> {
    className?: string;
    style?: CSSProperties;
    view?: string;
    views?: Record<string, ElementType | CalendarViewDefinition>;
    viewProps?: Record<string, unknown>;
    weekViewProps?: Partial<TimeGridViewProps<Event, Resource>>;
    locale?: CalendarLocale;
    localeFallback?: ReactNode;
    resources?: Resource[];
    range?: CalendarRangeDefinition;
    minTime?: CalendarDateInput;
    maxTime?: CalendarDateInput;
    step?: number;
    dividerInterval?: number;
    headerHeight?: number;
    timeLabelWidth?: number;
    cellWidth?: number;
    cellHeight?: number;
    showGrid?: boolean;
    showGridLines?: boolean;
    weekStart?: TimeGridViewProps<Event, Resource>["weekStart"];
    selectedRange?: { start: Date; end: Date };
    eventDraggable?: TimeGridViewProps<Event, Resource>["eventDraggable"];
    onEventDrop?: TimeGridViewProps<Event, Resource>["onEventDrop"];
    onSlotClick?: TimeGridViewProps<Event, Resource>["onSlotClick"];
    onSelectSlot?: TimeGridViewProps<Event, Resource>["onSelectSlot"];
    getResourceId?: TimeGridViewProps<Event, Resource>["getResourceId"];
    getResourceTitle?: TimeGridViewProps<Event, Resource>["getResourceTitle"];
    getEventResourceIds?: TimeGridViewProps<Event, Resource>["getEventResourceIds"];
    [key: string]: unknown;
}

interface ResolvedCalendarViewProps<Event extends CalendarEvent> {
    ViewComponent: ElementType;
    locale: CalendarLocale;
    sharedProps: Record<string, unknown>;
    defaultViewProps: Record<string, unknown>;
    legacyViewProps: Record<string, unknown>;
    viewProps: Record<string, unknown>;
    events: Event[];
    backgroundEvents: Event[];
    view: string;
}

const ResolvedCalendarView = <Event extends CalendarEvent>({
    ViewComponent,
    locale,
    sharedProps,
    defaultViewProps,
    legacyViewProps,
    viewProps,
    events,
    backgroundEvents,
    view
}: ResolvedCalendarViewProps<Event>) => (
    <ViewComponent
        {...sharedProps}
        {...defaultViewProps}
        {...legacyViewProps}
        {...viewProps}
        locale={readCalendarLocale(locale)}
        events={events}
        backgroundEvents={backgroundEvents}
        viewName={view}
    />
);

const isViewDefinition = (
    value: ElementType | CalendarViewDefinition
): value is CalendarViewDefinition => (
    typeof value === "object" && value !== null && "component" in value
);

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
    weekViewProps = EMPTY_PROPS,
    locale = DEFAULT_CALENDAR_LOCALE,
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
    const legacyViewProps = view === "week" ? weekViewProps : {};

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
                    sharedProps={sharedProps}
                    defaultViewProps={defaultViewProps}
                    legacyViewProps={legacyViewProps}
                    viewProps={viewProps}
                    events={events}
                    backgroundEvents={backgroundEvents}
                    view={view}
                />
            </Suspense>
        </div>
    );
}
