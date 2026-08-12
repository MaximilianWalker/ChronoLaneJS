import type { Meta, StoryObj } from "@storybook/react-vite";

import { WeekView } from "../../src/index.js";
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

const meta = {
    title: "Scenarios/Events",
    component: WeekView,
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
} satisfies Meta<typeof WeekView>;

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
        cellHeight: 20
    }
};

export const MultiDay: Story = {
    args: {
        events: multiDayEvents,
        range: 3
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
