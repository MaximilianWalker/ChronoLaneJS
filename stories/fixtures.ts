import type { CalendarEvent } from "../src/index.js";

export interface StoryResource {
    id: string;
    name: string;
    group: string;
}

export interface StoryEvent extends CalendarEvent {
    id: string;
}

export const ANCHOR_DATE = "2026-09-14";
export const MONTH_DATE = "2026-09-14";
export const DST_START_DATE = "2026-03-29";
export const MIN_TIME = "1970-01-01T08:00:00";
export const MAX_TIME = "1970-01-01T18:00:00";

export const resources: StoryResource[] = [
    { id: "studio", name: "Studio", group: "Creative" },
    { id: "workshop", name: "Workshop", group: "Engineering" },
    { id: "terrace", name: "Terrace", group: "Community" }
];

export const basicEvents: StoryEvent[] = [
    {
        id: "planning",
        title: "Planning",
        description: "Set priorities for the week",
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
        id: "retrospective",
        title: "Retrospective",
        start: "2026-09-18T15:00:00",
        end: "2026-09-18T16:30:00",
        color: "#059669"
    }
];

export const adjacentEvents: StoryEvent[] = [
    {
        id: "adjacent-one",
        title: "First session",
        start: "2026-09-14T09:00:00",
        end: "2026-09-14T10:00:00",
        color: "#2563eb"
    },
    {
        id: "adjacent-two",
        title: "Second session",
        start: "2026-09-14T10:00:00",
        end: "2026-09-14T11:00:00",
        color: "#7c3aed"
    }
];

export const overlappingEvents: StoryEvent[] = [
    {
        id: "overlap-one",
        title: "Product workshop",
        start: "2026-09-14T09:00:00",
        end: "2026-09-14T12:00:00",
        color: "#2563eb"
    },
    {
        id: "overlap-two",
        title: "Customer interview",
        start: "2026-09-14T09:30:00",
        end: "2026-09-14T10:30:00",
        color: "#dc2626"
    },
    {
        id: "overlap-three",
        title: "Technical review",
        start: "2026-09-14T10:00:00",
        end: "2026-09-14T11:30:00",
        color: "#7c3aed"
    },
    {
        id: "overlap-four",
        title: "Content critique",
        start: "2026-09-14T10:15:00",
        end: "2026-09-14T11:00:00",
        color: "#0891b2"
    }
];

export const overnightEvents: StoryEvent[] = [
    {
        id: "overnight",
        title: "Release monitoring",
        description: "One event clipped across two visible days",
        start: "2026-09-14T23:00:00",
        end: "2026-09-15T02:00:00",
        color: "#4338ca"
    }
];

export const multiDayEvents: StoryEvent[] = [
    {
        id: "conference",
        title: "Design systems conference",
        description: "A multi-day event appears on each time-grid day",
        start: "2026-09-14T14:00:00",
        end: "2026-09-16T11:00:00",
        color: "#be123c"
    },
    ...basicEvents
];

export const backgroundEvents: StoryEvent[] = [
    {
        id: "focus-hours",
        title: "Focus hours",
        start: "2026-09-14T13:00:00",
        end: "2026-09-14T16:00:00",
        color: "rgba(37, 99, 235, 0.14)"
    },
    {
        id: "maintenance",
        title: "Unavailable",
        start: "2026-09-16T09:00:00",
        end: "2026-09-16T12:00:00",
        color: "rgba(220, 38, 38, 0.14)"
    }
];

export const styledEvents: StoryEvent[] = [
    {
        id: "styled",
        title: "Branded launch",
        description: "Per-event styles and variants",
        start: "2026-09-14T09:00:00",
        end: "2026-09-14T11:30:00",
        color: "#f97316",
        variant: "featured",
        style: { borderRadius: 16, border: "2px solid #c2410c" },
        titleStyle: { textTransform: "uppercase", letterSpacing: "0.04em" },
        descriptionStyle: { fontStyle: "italic" }
    }
];

export const resourceEvents: StoryEvent[] = [
    {
        id: "studio-session",
        title: "Recording session",
        start: "2026-09-14T09:00:00",
        end: "2026-09-14T11:00:00",
        color: "#2563eb",
        resourceId: "studio"
    },
    {
        id: "shared-briefing",
        title: "Shared briefing",
        start: "2026-09-14T11:30:00",
        end: "2026-09-14T12:30:00",
        color: "#7c3aed",
        resourceIds: ["studio", "workshop"]
    },
    {
        id: "community-lunch",
        title: "Community lunch",
        start: "2026-09-14T13:00:00",
        end: "2026-09-14T14:30:00",
        color: "#059669",
        resource: { id: "terrace" }
    }
];

export const monthEvents: StoryEvent[] = [
    ...basicEvents,
    {
        id: "month-one",
        title: "Roadmap review",
        start: "2026-09-14T08:00:00",
        end: "2026-09-14T08:45:00",
        color: "#2563eb"
    },
    {
        id: "month-two",
        title: "Hiring sync",
        start: "2026-09-14T10:30:00",
        end: "2026-09-14T11:00:00",
        color: "#9333ea"
    },
    {
        id: "month-three",
        title: "Documentation",
        start: "2026-09-14T13:00:00",
        end: "2026-09-14T14:00:00",
        color: "#0891b2"
    },
    {
        id: "month-four",
        title: "Release prep",
        start: "2026-09-14T16:00:00",
        end: "2026-09-14T17:00:00",
        color: "#dc2626"
    },
    {
        id: "month-five",
        title: "Team dinner",
        start: "2026-09-14T19:00:00",
        end: "2026-09-14T21:00:00",
        color: "#ca8a04"
    },
    {
        id: "previous-month",
        title: "August close",
        start: "2026-08-31T15:00:00",
        end: "2026-08-31T16:00:00",
        color: "#64748b"
    },
    {
        id: "next-month",
        title: "October kickoff",
        start: "2026-10-01T09:00:00",
        end: "2026-10-01T10:00:00",
        color: "#059669"
    }
];

export const dstEvents: StoryEvent[] = [
    {
        id: "before-clock-change",
        title: "Before clock change",
        start: "2026-03-29T00:30:00",
        end: "2026-03-29T01:30:00",
        color: "#2563eb"
    },
    {
        id: "after-clock-change",
        title: "After clock change",
        start: "2026-03-29T03:00:00",
        end: "2026-03-29T04:00:00",
        color: "#dc2626"
    }
];
