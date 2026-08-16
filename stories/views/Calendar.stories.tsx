import type { Meta, StoryObj } from "@storybook/react-vite";

import { StoryCalendar } from "../harnesses.js";
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
        }
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

export const Resources: Story = {
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
