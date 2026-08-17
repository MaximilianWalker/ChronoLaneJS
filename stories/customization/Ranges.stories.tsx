import { addDays } from "date-fns/addDays";
import { startOfWeek } from "date-fns/startOfWeek";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { TimeGridView, asCalendarDate } from "../../src/index.js";
import type { CalendarRange } from "../../src/index.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents
} from "../fixtures.js";

const TIME_ZONE = "UTC";
const calendarDate = (day: number): Date => (
    asCalendarDate(`2026-09-${String(day).padStart(2, "0")}`, TIME_ZONE)
);

const explicitRange = (visibleDays: number[]): CalendarRange => {
    const days = visibleDays.map(calendarDate);
    return {
        start: days[0]!,
        end: days.at(-1)!,
        days
    };
};

const meta = {
    title: "Customization/Ranges",
    component: TimeGridView,
    args: {
        defaultDate: ANCHOR_DATE,
        events: basicEvents,
        minTime: MIN_TIME,
        maxTime: MAX_TIME,
        onDateChange: fn(),
        onRangeChange: fn()
    },
    argTypes: {
        events: { control: false },
        range: { control: false }
    },
    parameters: {
        calendar: { timeZone: TIME_ZONE }
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
        await expect(args.onDateChange).toHaveBeenCalledWith(calendarDate(21));
        await waitFor(() => expect(args.onRangeChange).toHaveBeenLastCalledWith(
            explicitRange([21, 23, 25])
        ));
    }
};

export const AnchorAwareDefinition: Story = {
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
        await expect(args.onDateChange).toHaveBeenCalledWith(calendarDate(21));
        await waitFor(() => expect(args.onRangeChange).toHaveBeenLastCalledWith(
            explicitRange([21, 22, 23, 24, 25])
        ));
    }
};

export const CustomNavigation: Story = {
    args: {
        range: {
            dayCount: 3,
            navigation: {
                resolveAnchor: (anchor, direction) => (
                    addDays(anchor, direction * 14)
                )
            }
        }
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "Next range" }));
        await expect(args.onDateChange).toHaveBeenCalledWith(calendarDate(28));
        await waitFor(() => expect(args.onRangeChange).toHaveBeenLastCalledWith(
            explicitRange([28, 29, 30])
        ));
    }
};
