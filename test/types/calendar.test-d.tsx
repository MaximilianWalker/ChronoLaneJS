import type { ReactNode } from "react";

import Calendar, {
    AgendaView,
    DayView,
    MonthView,
    TimeGridView,
    WeekView,
    resolveCalendarRange
} from "../../src/index.js";
import type {
    CalendarEvent,
    CalendarProps,
    CalendarRangeOptions,
    CalendarResourceConfig,
    CalendarSelectionRange,
    CalendarViewProps,
    SharedViewProps,
    TimeGridDayHeaderProps,
    TimeGridEventProps,
    TimeGridResourceHeaderProps,
    TimeGridSlotSizing,
    TimeGridSlotProps
} from "../../src/index.js";

interface ProjectEvent extends CalendarEvent {
    id: string;
    category: "meeting" | "focus";
}

interface ProjectResource {
    id: string;
    name: string;
}

const events: ProjectEvent[] = [];
const resources: ProjectResource[] = [];
const slotSizing: TimeGridSlotSizing = {
    minWidth: 92,
    height: 40
};
const selectedRange = {
    start: "2026-09-14T10:00:00",
    end: new Date(2026, 8, 14, 12)
} satisfies CalendarSelectionRange;
const monthViewProps = {
    maxEventsPerDay: 3
} satisfies CalendarViewProps<"month", ProjectEvent>;
const projectRange = {
    dates: [
        new Date(2026, 8, 14),
        new Date(2026, 8, 16),
        new Date(2026, 8, 18)
    ],
    navigation: { stepDays: 7 }
} satisfies CalendarRangeOptions;
const resolvedProjectRange = resolveCalendarRange(projectRange, new Date(2026, 8, 14));

void resolvedProjectRange.navigate(1);
const projectResources: CalendarResourceConfig<ProjectEvent, ProjectResource> = {
    items: resources,
    getId: (resource) => resource.id,
    getTitle: (resource) => resource.name,
    getEventIds: (event) => [event.category]
};

void <Calendar view="month" events={events} viewProps={monthViewProps} />;
void (
    <Calendar
        minDate="2026-01-01"
        maxDate={new Date(2026, 11, 31)}
    />
);
// @ts-expect-error Navigation boundaries use CalendarDateInput values.
void <Calendar minDate={false} />;
void (
    <Calendar
        view="day"
        events={events}
        viewProps={{ resources: projectResources }}
    />
);

const invalidMonthViewProps = {
    maxEventsPerDay: 3,
    // @ts-expect-error Reusable view props reject known configuration from another view.
    minTime: "08:00"
} satisfies CalendarViewProps<"month", ProjectEvent>;

void invalidMonthViewProps;

const ProjectEventRenderer = ({
    event,
    segment,
    selected,
    elementProps
}: TimeGridEventProps<ProjectEvent, ProjectResource>) => {
    void event.category;
    void segment.dayIndex;
    void segment.columnResourceId;
    void segment.resource?.name;
    void selected;
    void elementProps.onClick;
    return null;
};

const ProjectSlotRenderer = ({
    slot,
    selected,
    elementProps
}: TimeGridSlotProps<ProjectResource>) => {
    void slot.dayIndex;
    void slot.resourceId;
    void slot.resource?.name;
    void selected;
    void elementProps.style;
    return null;
};

const ProjectDayHeader = ({
    day,
    dayIndex,
    columns,
    title
}: TimeGridDayHeaderProps<ProjectResource>) => {
    void day;
    void dayIndex;
    void columns[0]?.resource?.name;
    void title;
    return null;
};

const ProjectResourceHeader = ({
    resource,
    resourceId,
    resourceIndex,
    columns,
    title
}: TimeGridResourceHeaderProps<ProjectResource>) => {
    void resource.name;
    void resourceId;
    void resourceIndex;
    void columns[0]?.dayIndex;
    void title;
    return null;
};

const defaultWeekProps: CalendarProps<ProjectEvent, ProjectResource> = {
    events,
    viewProps: { minTime: "08:00" },
    onEventSelect: (event) => event.category
};

void defaultWeekProps;

void <Calendar view="agenda" events={events} viewProps={{ range: 14 }} />;
void (
    <Calendar
        view="day"
        events={events}
        viewProps={{ minTime: "08:00", maxTime: "18:00" }}
    />
);
void <Calendar view="month" events={events} viewProps={{ maxEventsPerDay: 3 }} />;
void (
    <Calendar<ProjectEvent, ProjectResource>
        view="day"
        events={events}
        viewProps={{
            resources: {
                items: resources,
                getId: (resource) => resource.id,
                getTitle: (resource) => resource.name,
                getEventIds: (event) => [event.category]
            }
        }}
    />
);
void <Calendar view="time-grid" events={events} viewProps={{ range: projectRange }} />;
void (
    <Calendar
        view="week"
        events={events}
        viewProps={{
            slotDuration: 30,
            labelInterval: 60,
            slotSizing
        }}
    />
);
void (
    <Calendar
        view="day"
        viewProps={{ slotSizing: { width: 120, minHeight: 0 } }}
    />
);
void <AgendaView className="agenda" style={{ color: "navy" }} />;
void <DayView
    className="schedule"
    style={{
        "--calendar-time-grid-header-row-height": "40px",
        "--calendar-time-grid-line-width": "0px",
        "--calendar-time-grid-time-axis-width": "72px"
    }}
/>;
void <MonthView className="month" style={{ minHeight: 600 }} />;
void <WeekView className="week" style={{ color: "navy" }} />;
void <TimeGridView className="custom-range" style={{ minHeight: 600 }} />;
void <DayView selectedRange={selectedRange} timeZone="Europe/Lisbon" />;

// @ts-expect-error Navigation behavior belongs to the range definition.
void <TimeGridView navigationStep={7} />;

// @ts-expect-error Month navigation is fixed to the displayed month.
void <MonthView navigateDate={() => new Date()} />;

const legacyRangeCount = {
    // @ts-expect-error Generated range counts use dayCount.
    days: 7
} satisfies CalendarRangeOptions;

void legacyRangeCount;

const invalidRangeNavigation = {
    dayCount: 7,
    navigation: {
        // @ts-expect-error Custom range navigation must resolve a Date anchor.
        resolveAnchor: () => "2026-09-21"
    }
} satisfies CalendarRangeOptions;

void invalidRangeNavigation;

const invalidSelectedRange = {
    start: "2026-09-14T10:00:00",
    // @ts-expect-error Selection boundaries use CalendarDateInput values.
    end: false
} satisfies CalendarSelectionRange;

void invalidSelectedRange;

// @ts-expect-error Known calendar tokens reject unsupported values.
void <Calendar style={{ "--calendar-scrollbar-width": "wide" }} />;

// @ts-expect-error Layout-sensitive tokens require deterministic pixel lengths.
void <Calendar style={{ "--calendar-time-grid-time-axis-width": "20%" }} />;

// @ts-expect-error Layout-sensitive tokens cannot use content-dependent tracks.
void <Calendar style={{ "--calendar-time-grid-time-axis-width": "auto" }} />;

void (
    <Calendar
        style={{
            "--calendar-scrollbar-size": "12px",
            "--calendar-scrollbar-thumb": "#64748b"
        }}
    />
);
void (
    <Calendar<ProjectEvent, ProjectResource>
        view="week"
        events={events}
        viewProps={{
            resources: { items: resources },
            groupBy: "resource",
            components: {
                event: ProjectEventRenderer,
                slot: ProjectSlotRenderer,
                dayHeader: ProjectDayHeader,
                resourceHeader: ProjectResourceHeader
            }
        }}
    />
);
void <Calendar events={events} viewProps={{ minTime: "08:00" }} />;
void <Calendar view="month" viewProps={{ maxEventsPerDay: 2 }} />;

// @ts-expect-error Unknown root props must not bypass the public contract.
void <Calendar view="week" eventz={events} />;

// @ts-expect-error The redundant resource view is not a built-in view.
void <Calendar view="resource" />;

// @ts-expect-error View-specific props cannot bypass viewProps.
void <Calendar view="day" slotSizing={{ width: 92 }} />;

// @ts-expect-error Resource items and accessors must use the grouped contract.
void <Calendar view="day" viewProps={{ resources }} />;

void (
    <Calendar<ProjectEvent, ProjectResource>
        view="day"
        // @ts-expect-error Resource ID accessors must return stable string or number IDs.
        viewProps={{ resources: { items: resources, getId: () => ({}) } }}
    />
);

// @ts-expect-error Flat resource accessors are removed.
void <Calendar view="day" getResourceId={(resource: ProjectResource) => resource.id} />;

// @ts-expect-error Resource grouping only accepts the two supported dimensions.
void <Calendar view="week" viewProps={{ groupBy: "team" }} />;

// @ts-expect-error The combined time-grid column header was removed.
void <Calendar view="week" viewProps={{ components: { columnHeader: ProjectDayHeader } }} />;

// @ts-expect-error Renderer replacements must be grouped under components.
void <Calendar view="week" viewProps={{ eventComponent: ProjectEventRenderer }} />;

void (
    // @ts-expect-error Event renderers receive a segment instead of a top-level dayIndex.
    <Calendar
        view="week"
        viewProps={{ components: { event: (_props: { dayIndex: number }) => null } }}
    />
);

// @ts-expect-error Month views do not accept time-grid scale props.
void <Calendar view="month" viewProps={{ minTime: "08:00" }} />;

// @ts-expect-error Slot sizing minimums must be numeric.
void <Calendar view="week" viewProps={{ slotSizing: { minWidth: "92" } }} />;

// @ts-expect-error The fluid sentinel was replaced by flat minimum properties.
void <Calendar view="week" viewProps={{ slotSizing: { height: "fluid" } }} />;

// @ts-expect-error Nested minimum objects were replaced by flat minimum properties.
void <Calendar view="week" viewProps={{ slotSizing: { width: { min: 92 } } }} />;

// @ts-expect-error Fixed width and minimum width are mutually exclusive.
void <Calendar view="week" viewProps={{ slotSizing: { width: 92, minWidth: 80 } }} />;

// @ts-expect-error Fixed height and minimum height are mutually exclusive.
void <Calendar view="week" viewProps={{ slotSizing: { height: 40, minHeight: 20 } }} />;

// @ts-expect-error Flat cell dimensions were replaced by slotSizing.
void <Calendar view="week" cellWidth={92} />;

// @ts-expect-error Flat cell dimensions were replaced by slotSizing.
void <Calendar view="week" cellHeight={50} />;

// @ts-expect-error Header height is controlled by the typed theme token.
void <Calendar view="week" headerHeight={50} />;

// @ts-expect-error The time axis width is controlled by the typed theme token.
void <Calendar view="week" timeLabelWidth={64} />;

// @ts-expect-error Grid lines are controlled by the typed theme token.
void <Calendar view="week" showGridLines={false} />;

// @ts-expect-error Agenda views do not accept month overflow props.
void <Calendar view="agenda" maxEventsPerDay={3} />;

// @ts-expect-error Omitting view selects the week contract.
void <Calendar maxEventsPerDay={3} />;

// @ts-expect-error Built-in viewProps are tied to the selected view.
void <Calendar view="month" viewProps={{ minTime: "08:00" }} />;

void (
    // @ts-expect-error Drop callbacks must consume the complete drop payload.
    <Calendar
        view="week"
        viewProps={{ onEventDrop: (_change: { start: string }) => undefined }}
    />
);

// @ts-expect-error Unsupported names require an application view registry.
void <Calendar view="quarter" />;

interface QuarterViewProps extends SharedViewProps<ProjectEvent> {
    compact?: boolean;
    heading?: ReactNode;
    months?: number;
}

export const QuarterView = (_props: QuarterViewProps) => null;
const customViews = {
    quarter: {
        component: QuarterView,
        defaultProps: { months: 3 }
    }
} as const;

void (
    <Calendar
        view="quarter"
        views={customViews}
        events={events}
        viewProps={{ compact: true, heading: "Quarter" }}
    />
);

const customProps: CalendarProps<
    ProjectEvent,
    ProjectResource,
    typeof customViews
> = {
    view: "quarter",
    views: customViews,
    events,
    viewProps: { months: 6 }
};

void customProps;

// @ts-expect-error Custom viewProps are inferred from the registered component.
void <Calendar view="quarter" views={customViews} viewProps={{ compact: "yes" }} />;

void (
    // @ts-expect-error Registered defaults must match the custom component props.
    <Calendar
        view="quarter"
        views={{
            quarter: {
                component: QuarterView,
                defaultProps: { months: "three" }
            }
        }}
    />
);

// @ts-expect-error The selected custom view must exist in the supplied registry.
void <Calendar view="year" views={customViews} />;
