import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { WeekView } from "../../src/index.js";
import type { TimeGridViewProps } from "../../src/index.js";
import { CustomTimeGridEvent } from "../harnesses.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    adjacentEvents,
    backgroundEvents,
    basicEvents,
    multiDayEvents,
    overnightEvents,
    overlappingEvents,
    styledEvents
} from "../fixtures.js";
import type { StoryEvent, StoryResource } from "../fixtures.js";

const meta = {
    title: "Scenarios/Events",
    component: WeekView<StoryEvent, StoryResource>,
    args: {
        date: ANCHOR_DATE,
        minTime: MIN_TIME,
        maxTime: MAX_TIME,
        showControls: false
    },
    argTypes: {
        events: { control: false },
        backgroundEvents: { control: false }
    }
} satisfies Meta<TimeGridViewProps<StoryEvent, StoryResource>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Adjacent: Story = {
    args: {
        events: adjacentEvents
    }
};

export const DenseOverlap: Story = {
    args: {
        events: overlappingEvents,
        range: "day"
    }
};

export const Overnight: Story = {
    args: {
        events: overnightEvents,
        range: 2,
        minTime: "00:00",
        maxTime: "24:00",
        slotSizing: { height: 20 }
    }
};

export const MultiDay: Story = {
    args: {
        events: multiDayEvents,
        range: 3
    },
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector(
            ".time-grid-view_multi-day-region"
        )).not.toBeInTheDocument();
        await expect(canvasElement.querySelectorAll(
            '.time-grid-view_column-events [data-event-id="conference"]'
        )).toHaveLength(3);
    }
};

export const DedicatedMultiDay: Story = {
    args: {
        events: multiDayEvents,
        backgroundEvents: [multiDayEvents[0]!],
        range: 3,
        multiDayEventLayout: "dedicated"
    },
    play: async ({ canvasElement }) => {
        const region = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_multi-day-region"
        );
        const event = region?.querySelector<HTMLElement>(
            '[data-event-id="conference"]'
        );

        await expect(region).toHaveAccessibleName("Multi-day events");
        await expect(event).toBeVisible();
        await expect(canvasElement.querySelector(
            '.time-grid-view_column-events [data-event-id="conference"]'
        )).not.toBeInTheDocument();
        await expect(canvasElement.querySelector(
            '.time-grid-view_column-events [data-event-id="planning"]'
        )).toBeVisible();
        await expect(canvasElement.querySelectorAll(
            '[data-background-event-id="conference"]'
        )).toHaveLength(3);
    }
};

export const DedicatedMultiDayRenderer: Story = {
    args: {
        events: multiDayEvents.filter(({ id }) => id === "conference"),
        range: 3,
        multiDayEventLayout: "dedicated",
        components: { event: CustomTimeGridEvent }
    },
    play: async ({ canvasElement }) => {
        const event = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_multi-day-region .story-event"
        );

        await expect(event).toBeVisible();
        await expect(event).toHaveAttribute("data-story-layout", "dedicated");
        await expect(event).toHaveAttribute("data-story-day", "2026-09-14");
    }
};

export const BackgroundRegions: Story = {
    args: {
        events: basicEvents,
        backgroundEvents
    }
};

export const PerEventStyles: Story = {
    args: {
        events: styledEvents,
        range: "day"
    }
};

export const Selected: Story = {
    args: {
        events: basicEvents,
        selectedEventIds: ["planning", "research"]
    }
};
