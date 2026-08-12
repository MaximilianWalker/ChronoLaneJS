import type { ReactNode } from "react";

import Calendar from "../../src/index.js";
import type {
    CalendarEvent,
    CalendarProps,
    SharedViewProps,
    TimeGridDayHeaderProps,
    TimeGridEventProps,
    TimeGridResourceHeaderProps,
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
    minTime: "08:00",
    onEventSelect: (event) => event.category
};

void defaultWeekProps;

void <Calendar view="agenda" events={events} range={14} />;
void <Calendar view="day" events={events} minTime="08:00" maxTime="18:00" />;
void <Calendar view="month" events={events} maxEventsPerDay={3} />;
void (
    <Calendar
        view="day"
        events={events}
        resources={{
            items: resources,
            getId: (resource) => resource.id,
            getTitle: (resource) => resource.name,
            getEventIds: (event) => [event.category]
        }}
    />
);
void <Calendar view="time-grid" events={events} range={[new Date()]} />;
void <Calendar view="week" events={events} slotDuration={30} labelInterval={60} />;
void (
    <Calendar
        view="week"
        events={events}
        resources={{ items: resources }}
        groupBy="resource"
        components={{
            event: ProjectEventRenderer,
            slot: ProjectSlotRenderer,
            dayHeader: ProjectDayHeader,
            resourceHeader: ProjectResourceHeader
        }}
    />
);
void <Calendar events={events} minTime="08:00" />;
void <Calendar view="month" viewProps={{ maxEventsPerDay: 2 }} />;

// @ts-expect-error Unknown root props must not bypass the public contract.
void <Calendar view="week" eventz={events} />;

// @ts-expect-error The redundant resource view is not a built-in view.
void <Calendar view="resource" />;

// @ts-expect-error Resource items and accessors must use the grouped contract.
void <Calendar view="day" resources={resources} />;

// @ts-expect-error Resource ID accessors must return stable string or number IDs.
void <Calendar view="day" resources={{ items: resources, getId: () => ({}) }} />;

// @ts-expect-error Flat resource accessors are removed.
void <Calendar view="day" getResourceId={(resource: ProjectResource) => resource.id} />;

// @ts-expect-error Resource grouping only accepts the two supported dimensions.
void <Calendar view="week" groupBy="team" />;

// @ts-expect-error The combined time-grid column header was removed.
void <Calendar view="week" components={{ columnHeader: ProjectDayHeader }} />;

// @ts-expect-error Renderer replacements must be grouped under components.
void <Calendar view="week" eventComponent={ProjectEventRenderer} />;

// @ts-expect-error Event renderers receive a segment instead of a top-level dayIndex.
void <Calendar view="week" components={{ event: (_props: { dayIndex: number }) => null }} />;

// @ts-expect-error Month views do not accept time-grid scale props.
void <Calendar view="month" minTime="08:00" />;

// @ts-expect-error Agenda views do not accept month overflow props.
void <Calendar view="agenda" maxEventsPerDay={3} />;

// @ts-expect-error Omitting view selects the week contract.
void <Calendar maxEventsPerDay={3} />;

// @ts-expect-error Built-in viewProps are tied to the selected view.
void <Calendar view="month" viewProps={{ minTime: "08:00" }} />;

// @ts-expect-error Drop callbacks must consume the complete drop payload.
void <Calendar view="week" onEventDrop={(_change: { start: string }) => undefined} />;

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
