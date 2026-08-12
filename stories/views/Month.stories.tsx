import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { format } from "date-fns/format";

import {
    MonthView,
    defaultCalendarFormatters
} from "../../src/index.js";
import type { CalendarFormatters } from "../../src/index.js";
import {
    MONTH_DATE,
    backgroundEvents,
    monthEvents
} from "../fixtures.js";

const compactFormatters: CalendarFormatters = {
    ...defaultCalendarFormatters,
    weekday: (day, { locale }) => format(day, "EEEEE", { locale })
};

const meta = {
    title: "Views/Month",
    component: MonthView,
    args: {
        date: MONTH_DATE,
        events: monthEvents,
        maxEventsPerDay: 3,
        onShowMore: fn()
    },
    argTypes: {
        events: { control: false },
        backgroundEvents: { control: false },
        selectedDate: { control: false }
    }
} satisfies Meta<typeof MonthView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    play: async ({ canvasElement }) => {
        await expect(
            canvasElement.querySelector(
                ".month-view_grid-wrapper.calendar-scroll-region"
            )
        ).not.toBeNull();
    }
};

export const HiddenOutsideDays: Story = {
    args: {
        showOutsideDays: false
    }
};

export const Overflow: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const showMore = canvas.getByRole("button", { name: /more/i });
        await userEvent.click(showMore);
        await expect(args.onShowMore).toHaveBeenCalledOnce();
    }
};

export const SelectedDayAndEvent: Story = {
    args: {
        selectedDate: MONTH_DATE,
        selectedEventIds: ["planning"]
    }
};

export const BackgroundAvailability: Story = {
    args: {
        backgroundEvents
    }
};

export const Compact: Story = {
    args: {
        maxEventsPerDay: 1,
        formatters: compactFormatters
    }
};
