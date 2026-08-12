import type { Meta, StoryObj } from "@storybook/react-vite";

import { WeekView } from "../../src/index.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    backgroundEvents,
    basicEvents
} from "../fixtures.js";

const meta = {
    title: "Views/Week",
    component: WeekView,
    args: {
        date: ANCHOR_DATE,
        events: basicEvents,
        minTime: MIN_TIME,
        maxTime: MAX_TIME
    },
    argTypes: {
        events: { control: false },
        backgroundEvents: { control: false },
        range: { control: false }
    }
} satisfies Meta<typeof WeekView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const HalfHourSlots: Story = {
    args: {
        slotDuration: 30,
        labelInterval: 60,
        cellHeight: 34
    }
};

export const BackgroundAvailability: Story = {
    args: {
        backgroundEvents
    }
};

export const NarrowViewport: Story = {
    globals: {
        viewport: {
            value: "mobile2",
            isRotated: false
        }
    }
};

export const NoControls: Story = {
    args: {
        showControls: false
    }
};
