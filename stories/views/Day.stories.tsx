import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { DayView } from "../../src/index.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents
} from "../fixtures.js";

const meta = {
    title: "Views/Day",
    component: DayView,
    args: {
        date: ANCHOR_DATE,
        events: basicEvents,
        minTime: MIN_TIME,
        maxTime: MAX_TIME
    },
    argTypes: {
        events: { control: false },
        backgroundEvents: { control: false },
        range: { control: false },
        selectedRange: { control: false }
    }
} satisfies Meta<typeof DayView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Empty: Story = {
    args: {
        events: []
    }
};

export const BusinessHours: Story = {
    args: {
        minTime: "09:00",
        maxTime: "17:00",
        slotDuration: 30,
        labelInterval: 60
    }
};

export const FullDay: Story = {
    args: {
        minTime: "00:00",
        maxTime: "24:00",
        slotSizing: { height: 24 }
    }
};

export const SelectedEvent: Story = {
    args: {
        selectedEventIds: ["planning"]
    }
};

export const SelectedRange: Story = {
    args: {
        selectedRange: {
            start: "2026-09-14T10:00:00",
            end: "2026-09-14T12:00:00"
        }
    },
    play: async ({ canvasElement }) => {
        await expect(
            canvasElement.querySelectorAll(".time-grid-view_slot.is-selected")
        ).toHaveLength(2);
    },
    parameters: {
        calendar: {
            timeZone: "UTC"
        }
    }
};

export const WithoutGridLines: Story = {
    args: {
        style: {
            "--calendar-time-grid-line-width": "0px"
        }
    }
};
