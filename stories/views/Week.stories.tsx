import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

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
        slotSizing: { height: 34 }
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
    },
    render: (args) => (
        <div style={{ height: 650, maxWidth: "100%", width: 390 }}>
            <WeekView {...args} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const wrapper = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid-wrapper"
        );
        const grid = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid"
        );
        const header = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_day-header.is-primary"
        );
        const firstSlot = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_slot.is-first-column"
        );

        if (!wrapper || !grid || !header || !firstSlot) {
            throw new Error("The narrow week grid did not render.");
        }

        const columnWidths = window.getComputedStyle(grid).gridTemplateColumns
            .split(" ")
            .map(Number.parseFloat);

        await expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);
        await expect(Math.min(...columnWidths)).toBeGreaterThanOrEqual(96);

        wrapper.scrollLeft = 240;
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

        await expect(wrapper.scrollLeft).toBeGreaterThan(0);
        await expect(Math.abs(
            header.getBoundingClientRect().left
            - firstSlot.getBoundingClientRect().left
        )).toBeLessThan(1);

        wrapper.scrollLeft = 0;
    }
};

export const NoControls: Story = {
    args: {
        showControls: false
    }
};
