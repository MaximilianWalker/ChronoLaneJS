import { addDays } from "date-fns/addDays";
import { startOfWeek } from "date-fns/startOfWeek";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

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
        maxTime: MAX_TIME,
        onDateChange: fn()
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
        range: 3
    }
};

export const WorkingWeek: Story = {
    args: {
        range: {
            start: (anchor) => startOfWeek(anchor, { weekStartsOn: 1 }),
            dayCount: 7,
            includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5,
            navigation: { stepDays: 7 }
        }
    }
};

export const ExplicitDates: Story = {
    args: {
        range: {
            dates: (anchor) => [
                anchor,
                addDays(anchor, 2),
                addDays(anchor, 4)
            ],
            navigation: { stepDays: 7 }
        }
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "Next range" }));
        await expect(args.onDateChange).toHaveBeenCalledWith(new Date(2026, 8, 21));
    }
};

export const AnchorAwareCallback: Story = {
    args: {
        range: (anchor, { weekStartsOn }) => ({
            start: startOfWeek(anchor, { weekStartsOn }),
            dayCount: 7,
            includeDay: (day) => day.getDay() !== 0 && day.getDay() !== 6,
            navigation: { stepDays: 7 }
        })
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "Next range" }));
        await expect(args.onDateChange).toHaveBeenCalledWith(new Date(2026, 8, 21));
    }
};
