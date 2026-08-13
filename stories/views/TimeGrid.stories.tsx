import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
    TimeGridView,
    defaultCalendarFormatters
} from "../../src/index.js";
import type { CalendarFormatters } from "../../src/index.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents
} from "../fixtures.js";

const headerFormatters: CalendarFormatters = {
    ...defaultCalendarFormatters,
    rangeHeader: ({ start, end }) => (
        <span>{start.toDateString()} → {end.toDateString()}</span>
    )
};

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
        slotSizing: { height: 26 }
    }
};

export const FluidSlotHeight: Story = {
    args: {
        range: "day",
        slotSizing: {
            minWidth: 120,
            minHeight: 0
        }
    },
    render: (args) => (
        <div data-testid="fluid-slot-container" style={{ height: 620 }}>
            <TimeGridView {...args} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const container = canvasElement.querySelector<HTMLElement>(
            '[data-testid="fluid-slot-container"]'
        );
        const view = canvasElement.querySelector<HTMLElement>(".time-grid-view");
        const body = canvasElement.querySelector<HTMLElement>(".time-grid-view_body");
        const grid = canvasElement.querySelector<HTMLElement>(".time-grid-view_grid");
        const slot = canvasElement.querySelector<HTMLElement>(".time-grid-view_slot");

        if (!container || !view || !body || !grid || !slot) {
            throw new Error("The fluid slot-sizing example did not render.");
        }

        await expect(view.clientHeight).toBe(container.clientHeight);
        await expect(grid.clientHeight).toBe(body.clientHeight);
        await expect(slot.getBoundingClientRect().height).toBeGreaterThan(50);
    }
};

export const MinimumSlotHeight: Story = {
    args: {
        range: "day",
        slotSizing: {
            minHeight: 60
        }
    },
    render: (args) => (
        <div data-testid="minimum-slot-container" style={{ height: 420 }}>
            <TimeGridView {...args} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const wrapper = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid-wrapper"
        );
        const slot = canvasElement.querySelector<HTMLElement>(".time-grid-view_slot");

        if (!wrapper || !slot) {
            throw new Error("The minimum slot-sizing example did not render.");
        }

        await expect(wrapper.scrollHeight).toBeGreaterThan(wrapper.clientHeight);
        await expect(slot.getBoundingClientRect().height).toBe(60);
    }
};

export const FixedSlotSizeWithVerticalOverflow: Story = {
    args: {
        range: "day",
        slotSizing: {
            width: 160,
            height: 60
        }
    },
    render: (args) => (
        <div data-testid="fixed-overflow-container" style={{ height: 420 }}>
            <TimeGridView {...args} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const wrapper = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid-wrapper"
        );
        const grid = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid"
        );

        if (!wrapper || !grid) {
            throw new Error("The fixed overflow time grid did not render.");
        }

        const columnWidths = window.getComputedStyle(grid).gridTemplateColumns
            .split(" ")
            .map(Number.parseFloat);

        await expect(wrapper.scrollHeight).toBeGreaterThan(wrapper.clientHeight);
        await expect(wrapper.scrollWidth).toBe(wrapper.clientWidth);
        await expect(columnWidths).toEqual([160]);
    }
};

export const ClassNameSizeOverride: Story = {
    args: {
        className: "story-time-grid-size-override",
        range: "day",
        slotSizing: {
            width: 160,
            height: 60
        }
    },
    play: async ({ canvasElement }) => {
        const view = canvasElement.querySelector<HTMLElement>(".time-grid-view");

        if (!view) {
            throw new Error("The class-sized time grid did not render.");
        }

        const style = window.getComputedStyle(view);

        await expect(view).not.toHaveAttribute("style");
        await expect(style.width).toBe("700px");
        await expect(style.maxWidth).toBe("none");
        await expect(style.height).toBe("300px");
        await expect(style.maxHeight).toBe("none");
    }
};

export const HeaderFormatter: Story = {
    args: {
        range: 3,
        formatters: headerFormatters
    }
};
