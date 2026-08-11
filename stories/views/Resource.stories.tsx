import type { Meta, StoryObj } from "@storybook/react-vite";

import { ResourceView } from "../../src/index.js";
import type { CalendarEvent } from "../../src/index.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    resourceEvents,
    resources
} from "../fixtures.js";
import type {
    StoryEvent,
    StoryResource
} from "../fixtures.js";

interface Person {
    displayName: string;
    team: string;
    uuid: string;
}

interface AssignedEvent extends CalendarEvent {
    assigneeUuids: string[];
    id: string;
}

const people: Person[] = [
    { uuid: "ada", displayName: "Ada", team: "Platform" },
    { uuid: "grace", displayName: "Grace", team: "Design systems" }
];

const assignedEvents: AssignedEvent[] = [
    {
        id: "architecture",
        title: "Architecture review",
        start: "2026-09-14T09:00:00",
        end: "2026-09-14T10:30:00",
        color: "#2563eb",
        assigneeUuids: ["ada", "grace"]
    }
];

const StoryResourceView = ResourceView<StoryEvent, StoryResource>;

const meta = {
    title: "Views/Resource",
    component: StoryResourceView,
    args: {
        date: ANCHOR_DATE,
        events: resourceEvents,
        resources,
        minTime: MIN_TIME,
        maxTime: MAX_TIME
    },
    argTypes: {
        events: { control: false },
        resources: { control: false },
        getResourceId: { control: false },
        getResourceTitle: { control: false },
        getEventResourceIds: { control: false }
    }
} satisfies Meta<typeof StoryResourceView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const MultipleAssignments: Story = {
    args: {
        events: resourceEvents.filter((event) => event.id === "shared-briefing")
    }
};

export const CustomAccessors: Story = {
    render: ({ locale, timeZone }) => (
        <ResourceView<AssignedEvent, Person>
            date={ANCHOR_DATE}
            events={assignedEvents}
            resources={people}
            locale={locale}
            timeZone={timeZone}
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
            getResourceId={(person) => person.uuid}
            getResourceTitle={(person) => `${person.displayName} · ${person.team}`}
            getEventResourceIds={(event) => event.assigneeUuids}
        />
    )
};

export const EmptyResources: Story = {
    args: {
        resources: [],
        events: resourceEvents
    }
};
