import { useState } from "react";
import { startOfWeek } from "date-fns/startOfWeek";

import Calendar from "../../src/Calendar.js";
import type {
    CalendarEvent,
    CalendarEventId,
    CalendarResourceConfig,
    NormalizedCalendarEvent
} from "../../src/types.js";
import type { TimeGridGroupBy } from "../../src/views/time-grid/types.js";

type PlaygroundView = "day" | "week" | "month" | "agenda" | "resources" | "time-grid";

interface PlaygroundResource {
    id: string;
    name: string;
}

interface PlaygroundEvent extends CalendarEvent {
    id: string;
}

const ANCHOR_DATE = "2026-09-14";

const views: readonly { id: PlaygroundView; label: string; detail: string }[] = [
    { id: "day", label: "Day", detail: "Focused daily schedule" },
    { id: "week", label: "Week", detail: "Seven-day planning" },
    { id: "month", label: "Month", detail: "Compact calendar overview" },
    { id: "agenda", label: "Agenda", detail: "Readable event chronology" },
    {
        id: "resources",
        label: "Resources",
        detail: "Week grouped by day or resource"
    },
    { id: "time-grid", label: "Custom", detail: "Flexible work-week range" }
] as const;
const RESOURCE_GROUPING_OPTIONS: readonly TimeGridGroupBy[] = ["day", "resource"];

const resources: PlaygroundResource[] = [
    { id: "studio", name: "Studio" },
    { id: "workshop", name: "Workshop" },
    { id: "terrace", name: "Terrace" }
];

const resourceConfig: CalendarResourceConfig<PlaygroundEvent, PlaygroundResource> = {
    items: resources
};

const events: PlaygroundEvent[] = [
    {
        id: "planning",
        title: "Weekly planning",
        description: "Priorities and ownership",
        start: "2026-09-14T09:00:00",
        end: "2026-09-14T10:15:00",
        color: "#2563eb"
    },
    {
        id: "design-review",
        title: "Design review",
        description: "Calendar interaction pass",
        start: "2026-09-14T11:00:00",
        end: "2026-09-14T12:00:00",
        color: "#7c3aed"
    },
    {
        id: "research",
        title: "Research block",
        start: "2026-09-15T13:30:00",
        end: "2026-09-15T15:30:00",
        color: "#0891b2"
    },
    {
        id: "documentation",
        title: "Documentation",
        start: "2026-09-16T10:00:00",
        end: "2026-09-16T12:30:00",
        color: "#ea580c"
    },
    {
        id: "release",
        title: "Release readiness",
        start: "2026-09-18T14:00:00",
        end: "2026-09-18T16:00:00",
        color: "#059669"
    }
];

const monthEvents: PlaygroundEvent[] = [
    ...events,
    {
        id: "community",
        title: "Community call",
        start: "2026-09-22T16:00:00",
        end: "2026-09-22T17:00:00",
        color: "#db2777"
    },
    {
        id: "roadmap",
        title: "Roadmap review",
        start: "2026-09-28T09:30:00",
        end: "2026-09-28T10:30:00",
        color: "#4f46e5"
    }
];

const resourceEvents: PlaygroundEvent[] = [
    {
        id: "recording",
        title: "Recording session",
        start: "2026-09-14T09:00:00",
        end: "2026-09-14T11:00:00",
        color: "#2563eb",
        resourceId: "studio"
    },
    {
        id: "briefing",
        title: "Shared briefing",
        start: "2026-09-14T11:30:00",
        end: "2026-09-14T12:30:00",
        color: "#7c3aed",
        resourceIds: ["studio", "workshop"]
    },
    {
        id: "lunch",
        title: "Community lunch",
        start: "2026-09-14T13:00:00",
        end: "2026-09-14T14:30:00",
        color: "#059669",
        resourceId: "terrace"
    },
    {
        id: "prototype",
        title: "Prototype lab",
        start: "2026-09-15T10:00:00",
        end: "2026-09-15T12:00:00",
        color: "#0891b2",
        resourceId: "workshop"
    },
    {
        id: "community-session",
        title: "Community session",
        start: "2026-09-16T14:00:00",
        end: "2026-09-16T15:30:00",
        color: "#ea580c",
        resourceId: "terrace"
    },
    {
        id: "cross-team-review",
        title: "Cross-team review",
        start: "2026-09-17T09:30:00",
        end: "2026-09-17T10:30:00",
        color: "#db2777",
        resourceIds: ["studio", "terrace"]
    },
    {
        id: "editing",
        title: "Editing session",
        start: "2026-09-18T13:00:00",
        end: "2026-09-18T15:00:00",
        color: "#4f46e5",
        resourceId: "studio"
    }
];

const backgroundEvents: PlaygroundEvent[] = [
    {
        id: "focus-time",
        title: "Focus time",
        start: "2026-09-14T13:00:00",
        end: "2026-09-14T16:00:00",
        color: "#dbeafe"
    }
];

const customRange = {
    start: (anchor: Date) => startOfWeek(anchor, { weekStartsOn: 1 }),
    dayCount: 7,
    includeDay: (day: Date) => day.getDay() >= 1 && day.getDay() <= 5,
    navigation: { stepDays: 7 }
};

export default function Playground() {
    const [view, setView] = useState<PlaygroundView>("week");
    const [resourceGroupBy, setResourceGroupBy] = useState<TimeGridGroupBy>("day");
    const [selectedEventIds, setSelectedEventIds] = useState<CalendarEventId[]>([]);
    const activeView = views.find(({ id }) => id === view) ?? views[0]!;
    const activeViewDetail = view === "resources"
        ? `Week grouped by ${resourceGroupBy}`
        : activeView.detail;
    const visibleEvents = view === "resources"
        ? resourceEvents
        : view === "month"
            ? monthEvents
            : events;

    const selectEvent = (event: NormalizedCalendarEvent<PlaygroundEvent>) => {
        if (event.id != null) setSelectedEventIds([event.id]);
    };
    const calendarProps = {
        className: "showcase-calendar",
        defaultDate: ANCHOR_DATE,
        events: visibleEvents,
        locale: "en-US",
        timeZone: "UTC",
        selectedEventIds,
        onEventSelect: selectEvent
    } as const;
    const timeGridViewProps = {
        minTime: "08:00",
        maxTime: "18:00",
        slotDuration: 30,
        labelInterval: 60,
        slotSizing: { height: 28 }
    } as const;
    const calendar = (() => {
        switch (view) {
            case "agenda":
                return (
                    <Calendar<PlaygroundEvent, PlaygroundResource>
                        {...calendarProps}
                        key={view}
                        view="agenda"
                    />
                );
            case "day":
                return (
                    <Calendar<PlaygroundEvent, PlaygroundResource>
                        {...calendarProps}
                        key={view}
                        view="day"
                        backgroundEvents={backgroundEvents}
                        viewProps={timeGridViewProps}
                    />
                );
            case "month":
                return (
                    <Calendar<PlaygroundEvent, PlaygroundResource>
                        {...calendarProps}
                        key={view}
                        view="month"
                        viewProps={{ maxEventsPerDay: 2 }}
                    />
                );
            case "resources":
                return (
                    <Calendar<PlaygroundEvent, PlaygroundResource>
                        {...calendarProps}
                        key={view}
                        view="week"
                        viewProps={{
                            ...timeGridViewProps,
                            resources: resourceConfig,
                            groupBy: resourceGroupBy,
                            slotSizing: { width: 88, height: 28 }
                        }}
                    />
                );
            case "time-grid":
                return (
                    <Calendar<PlaygroundEvent, PlaygroundResource>
                        {...calendarProps}
                        key={view}
                        view="time-grid"
                        viewProps={{ ...timeGridViewProps, range: customRange }}
                    />
                );
            case "week":
                return (
                    <Calendar<PlaygroundEvent, PlaygroundResource>
                        {...calendarProps}
                        key={view}
                        view="week"
                        backgroundEvents={backgroundEvents}
                        viewProps={timeGridViewProps}
                    />
                );
        }
    })();

    return (
        <section className="playground-section section" id="playground" aria-labelledby="playground-title">
            <div className="section-heading section-heading--split">
                <div>
                    <p className="eyebrow">Interactive playground</p>
                    <h2 id="playground-title">One model. Every view.</h2>
                </div>
                <p>
                    Switch views, navigate dates, select events, and inspect a
                    real ChronoLaneJS calendar without leaving the page.
                </p>
            </div>

            <div className="playground-shell">
                <div className="playground-toolbar">
                    <div className="view-tabs" role="tablist" aria-label="Calendar view">
                        {views.map((option) => (
                            <button
                                key={option.id}
                                className={view === option.id ? "is-active" : ""}
                                type="button"
                                role="tab"
                                aria-selected={view === option.id}
                                onClick={() => {
                                    setView(option.id);
                                    setSelectedEventIds([]);
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <div className="playground-toolbar-controls">
                        {view === "resources"
                            ? (
                                <div
                                    className="resources-control"
                                    role="group"
                                    aria-label="Group resource schedule by"
                                >
                                    <span aria-hidden="true">Group by</span>
                                    <div className="resources-options">
                                        {RESOURCE_GROUPING_OPTIONS.map((groupBy) => (
                                            <button
                                                key={groupBy}
                                                type="button"
                                                aria-pressed={resourceGroupBy === groupBy}
                                                onClick={() => setResourceGroupBy(groupBy)}
                                            >
                                                {groupBy === "day" ? "Day" : "Resource"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                            : null}
                        <div className="playground-context" aria-live="polite">
                            <span>{activeView.label}</span>
                            <span>{activeViewDetail}</span>
                        </div>
                    </div>
                </div>

                <div className={`playground-canvas playground-canvas--${view}`}>
                    {calendar}
                </div>

                <div className="playground-footer">
                    <span>
                        <span className="status-dot" aria-hidden="true" />
                        Live component
                    </span>
                    <a href={`${import.meta.env.BASE_URL}storybook/`}>
                        Explore every scenario in Storybook <span aria-hidden="true">↗</span>
                    </a>
                </div>
            </div>
        </section>
    );
}
