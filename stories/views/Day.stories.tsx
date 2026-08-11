import type { Meta, StoryObj } from "@storybook/react-vite";

import {
    DayView,
    asCalendarDate
} from "../../src/index.js";
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
        minTime: "1970-01-01T09:00:00",
        maxTime: "1970-01-01T17:00:00",
        step: 30,
        dividerInterval: 60
    }
};

export const FullDay: Story = {
    args: {
        minTime: "1970-01-01T00:00:00",
        maxTime: "1970-01-01T23:59:59.999",
        cellHeight: 24
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
            start: asCalendarDate("2026-09-14T10:00:00", "Europe/Lisbon"),
            end: asCalendarDate("2026-09-14T12:00:00", "Europe/Lisbon")
        }
    },
    parameters: {
        calendar: {
            timeZone: "Europe/Lisbon"
        }
    }
};

export const WithoutGridLines: Story = {
    args: {
        showGridLines: false
    }
};
