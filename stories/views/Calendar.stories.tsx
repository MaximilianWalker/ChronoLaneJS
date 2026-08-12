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
        minTime: MIN_TIME,
        maxTime: MAX_TIME,
        onDateChange: fn()
    },
    argTypes: {
        view: {
            control: "select",
            options: ["day", "week", "month", "agenda", "time-grid"]
        },
        events: { control: false },
        backgroundEvents: { control: false },
        resources: { control: false },
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
        resources: resourceConfig,
        groupBy: "resource",
        cellWidth: 92
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
        minDate: "2026-09-14",
        maxDate: "2026-09-20"
    }
};
