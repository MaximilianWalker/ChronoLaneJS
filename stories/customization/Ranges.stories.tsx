import { startOfWeek } from "date-fns/startOfWeek";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TimeGridView } from "../../src/index.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents
} from "../fixtures.js";

const meta = {
    title: "Customization/Ranges",
    component: TimeGridView,
    args: {
        date: ANCHOR_DATE,
        events: basicEvents,
        minTime: MIN_TIME,
        maxTime: MAX_TIME
    },
    argTypes: {
        events: { control: false },
        range: { control: false }
    }
} satisfies Meta<typeof TimeGridView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConsecutiveDays: Story = {
    args: {
        range: 3,
        navigationStep: 3
    }
};

export const WorkingWeek: Story = {
    args: {
        range: {
            start: new Date(2026, 8, 14),
            days: 7,
            includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5,
            navigationStep: 7
        }
    }
};

export const ExplicitDates: Story = {
    args: {
        range: [
            new Date(2026, 8, 14),
            new Date(2026, 8, 16),
            new Date(2026, 8, 18)
        ],
        navigationStep: 7
    }
};

export const AnchorAwareCallback: Story = {
    args: {
        range: (anchor, { weekStartsOn }) => ({
            start: startOfWeek(anchor, { weekStartsOn }),
            days: 7,
            includeDay: (day) => day.getDay() !== 0 && day.getDay() !== 6,
            navigationStep: 7
        })
    }
};
