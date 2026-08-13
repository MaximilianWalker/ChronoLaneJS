import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
    ControlledNavigation,
    StoryCalendar
} from "../harnesses.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    backgroundEvents,
    basicEvents,
    resourceConfig,
    resourceEvents
} from "../fixtures.js";

const meta = {
    title: "Views/Calendar",
    component: StoryCalendar,
    args: {
        view: "week",
        date: ANCHOR_DATE,
        events: basicEvents,
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME
        },
        onDateChange: fn()
    },
    argTypes: {
        view: {
            control: "select",
            options: ["day", "week", "month", "agenda", "time-grid"]
        },
        events: { control: false },
        backgroundEvents: { control: false },
        views: { control: false },
        viewProps: { control: false }
    },
    parameters: {
        docs: {
            description: {
                component: "The root component selects a built-in or registered view while forwarding shared calendar behavior."
            }
        }
    }
} satisfies Meta<typeof StoryCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ViewSelector: Story = {};

export const WithBackgroundEvents: Story = {
    args: {
        backgroundEvents
    }
};

export const ResourceGrouping: Story = {
    args: {
        view: "week",
        events: resourceEvents,
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME,
            resources: resourceConfig,
            groupBy: "resource",
            slotSizing: { width: 92 }
        }
    }
};

export const Controlled: Story = {
    render: (args) => <ControlledNavigation {...args} />,
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "Next week" }));
        await expect(canvas.getByText("Controlled anchor: 2026-09-21")).toBeInTheDocument();
        await expect(args.onDateChange).toHaveBeenCalledOnce();
    }
};

export const BoundedNavigation: Story = {
    args: {
        date: "2026-09-17",
        minDate: "2026-09-16",
        maxDate: "2026-09-18"
    },
    play: async ({ canvasElement }) => {
        await expect(
            canvasElement.querySelectorAll(
                ".calendar-view_navigation-button:disabled"
            )
        ).toHaveLength(2);
    }
};

export const ControlledBeforeMinimum: Story = {
    args: {
        date: "2026-08-03",
        minDate: "2026-09-14",
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME,
            navigateDate: () => "2026-01-01"
        }
    },
    render: (args) => <ControlledNavigation {...args} />,
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "Next week" }));
        await expect(canvas.getByText("Controlled anchor: 2026-09-14")).toBeInTheDocument();
        await expect(args.onDateChange).toHaveBeenCalledOnce();
    }
};

export const ControlledAfterMaximum: Story = {
    args: {
        date: "2026-10-05",
        maxDate: "2026-09-20"
    },
    render: (args) => <ControlledNavigation {...args} />,
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "Previous week" }));
        await expect(canvas.getByText("Controlled anchor: 2026-09-20")).toBeInTheDocument();
        await expect(args.onDateChange).toHaveBeenCalledOnce();
    }
};
