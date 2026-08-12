import { useState } from "react";

import Calendar from "../../src/Calendar.js";
import type {
    CalendarEvent,
    CalendarEventId,
    NormalizedCalendarEvent
} from "../../src/types.js";

type PlaygroundView = "day" | "week" | "month" | "agenda" | "resource" | "time-grid";

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
    { id: "resource", label: "Resources", detail: "Parallel team lanes" },
    { id: "time-grid", label: "Custom", detail: "Flexible work-week range" }
] as const;

const resources: PlaygroundResource[] = [
    { id: "studio", name: "Studio" },
    { id: "workshop", name: "Workshop" },
    { id: "terrace", name: "Terrace" }
];

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
        start: "2026-09-14T15:00:00",
        end: "2026-09-14T17:00:00",
        color: "#0891b2",
        resourceId: "workshop"
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
    start: new Date(2026, 8, 14),
    days: 7,
    includeDay: (day: Date) => day.getDay() >= 1 && day.getDay() <= 5,
    navigationStep: 7
};

const getResourceId = (resource: PlaygroundResource) => resource.id;
const getResourceTitle = (resource: PlaygroundResource) => resource.name;

export default function Playground() {
    const [view, setView] = useState<PlaygroundView>("week");
    const [selectedEventIds, setSelectedEventIds] = useState<CalendarEventId[]>([]);
    const activeView = views.find(({ id }) => id === view) ?? views[0]!;
    const visibleEvents = view === "resource"
        ? resourceEvents
        : view === "month"
            ? monthEvents
            : events;

    const selectEvent = (event: NormalizedCalendarEvent<PlaygroundEvent>) => {
        if (event.id != null) setSelectedEventIds([event.id]);
    };

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
                    <div className="playground-context" aria-live="polite">
                        <span>{activeView.label}</span>
                        <span>{activeView.detail}</span>
                    </div>
                </div>

                <div className={`playground-canvas playground-canvas--${view}`}>
                    <Calendar<PlaygroundEvent, PlaygroundResource>
                        key={view}
                        className="showcase-calendar"
                        view={view}
                        defaultDate={ANCHOR_DATE}
                        events={visibleEvents}
                        backgroundEvents={view === "day" || view === "week"
                            ? backgroundEvents
                            : undefined}
                        resources={view === "resource" ? resources : undefined}
                        range={view === "time-grid" ? customRange : undefined}
                        minTime="08:00"
                        maxTime="18:00"
                        slotDuration={30}
                        labelInterval={60}
                        cellHeight={28}
                        maxEventsPerDay={2}
                        locale="en-US"
                        timeZone="Europe/Lisbon"
                        selectedEventIds={selectedEventIds}
                        onEventSelect={selectEvent}
                        getResourceId={getResourceId}
                        getResourceTitle={getResourceTitle}
                    />
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
