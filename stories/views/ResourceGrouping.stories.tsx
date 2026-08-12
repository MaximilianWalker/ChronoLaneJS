import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
    DayView,
    TimeGridView,
    WeekView
} from "../../src/index.js";
import type {
    CalendarEvent,
    CalendarResourceConfig
} from "../../src/index.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    resourceConfig,
    resourceEvents
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

const assignedEvents: AssignedEvent[] = [{
    id: "architecture",
    title: "Architecture review",
    start: "2026-09-14T09:00:00",
    end: "2026-09-14T10:30:00",
    color: "#2563eb",
    assigneeUuids: ["ada", "grace"]
}];

const assignedResourceConfig: CalendarResourceConfig<AssignedEvent, Person> = {
    items: people,
    getId: (person) => person.uuid,
    getTitle: (person) => `${person.displayName} · ${person.team}`,
    getEventIds: (event) => event.assigneeUuids
};

const StoryWeekView = WeekView<StoryEvent, StoryResource>;

const meta = {
    title: "Capabilities/Resource grouping",
    component: StoryWeekView,
    args: {
        date: ANCHOR_DATE,
        events: resourceEvents,
        resources: resourceConfig,
        groupBy: "day",
        minTime: MIN_TIME,
        maxTime: MAX_TIME,
        cellWidth: 92
    },
    argTypes: {
        events: { control: false },
        resources: { control: false },
        groupBy: {
            control: "inline-radio",
            options: ["day", "resource"]
        }
    },
    parameters: {
        docs: {
            description: {
                component: "Resources subdivide time-grid ranges. Choose whether days or resources form the outer header groups."
            }
        }
    }
} satisfies Meta<typeof StoryWeekView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GroupedByDay: Story = {
    play: async ({ canvasElement }) => {
        await expect(
            canvasElement.querySelectorAll(
                ".time-grid-view_day-header.is-primary"
            )
        ).toHaveLength(7);
        await expect(
            canvasElement.querySelectorAll(
                ".time-grid-view_resource-header.is-secondary"
            )
        ).toHaveLength(21);
    }
};

export const GroupedByResource: Story = {
    args: { groupBy: "resource" },
    play: async ({ canvasElement }) => {
        await expect(
            canvasElement.querySelectorAll(
                ".time-grid-view_resource-header.is-primary"
            )
        ).toHaveLength(3);
        await expect(
            canvasElement.querySelectorAll(
                ".time-grid-view_day-header.is-secondary"
            )
        ).toHaveLength(21);
    }
};

export const DayRange: Story = {
    render: (args) => <DayView<StoryEvent, StoryResource> {...args} />
};

export const MultipleAssignments: Story = {
    args: {
        events: resourceEvents.filter((event) => event.id === "shared-briefing")
    },
    render: (args) => <DayView<StoryEvent, StoryResource> {...args} />
};

export const WithoutResources: Story = {
    args: {
        events: [],
        resources: undefined,
        groupBy: "resource"
    },
    play: async ({ canvasElement }) => {
        await expect(
            canvasElement.querySelectorAll(".time-grid-view_resource-header")
        ).toHaveLength(0);
        await expect(
            canvasElement.querySelectorAll(".time-grid-view_day-header")
        ).toHaveLength(7);
    }
};

export const CustomTimeGridRange: Story = {
    render: (args) => (
        <TimeGridView<StoryEvent, StoryResource>
            {...args}
            range={[
                new Date(2026, 8, 14),
                new Date(2026, 8, 16),
                new Date(2026, 8, 18)
            ]}
            navigationStep={7}
        />
    )
};

export const CustomAccessors: Story = {
    render: ({ locale, timeZone }) => (
        <DayView
            date={ANCHOR_DATE}
            events={assignedEvents}
            resources={assignedResourceConfig}
            locale={locale}
            timeZone={timeZone}
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
        />
    )
};
