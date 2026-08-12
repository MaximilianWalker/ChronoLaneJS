import type { Meta, StoryObj } from "@storybook/react-vite";

import { TimeGridView } from "../../src/index.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents
} from "../fixtures.js";

const meta = {
    title: "Views/Time Grid",
    component: TimeGridView,
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
        resources: { control: false }
    }
} satisfies Meta<typeof TimeGridView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WorkWeek: Story = {
    args: {
        range: {
            start: new Date(2026, 8, 14),
            days: 7,
            includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5,
            navigationStep: 7
        }
    }
};

export const NonContiguousDays: Story = {
    args: {
        range: [
            new Date(2026, 8, 14),
            new Date(2026, 8, 16),
            new Date(2026, 8, 18)
        ],
        navigationStep: 7
    }
};

export const TwoDayRange: Story = {
    args: {
        range: 2,
        navigationStep: 2
    }
};

export const FifteenMinuteScale: Story = {
    args: {
        range: "day",
        slotDuration: 15,
        labelInterval: 60,
        cellHeight: 26
    }
};

export const HeaderFormatter: Story = {
    args: {
        range: 3,
        formatHeader: ({ start, end }) => (
            <span>{start.toDateString()} → {end.toDateString()}</span>
        )
    }
};
