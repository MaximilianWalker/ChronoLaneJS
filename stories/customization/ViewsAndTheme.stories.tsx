import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
    CustomViewExample,
    StoryCalendar
} from "../harnesses.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents
} from "../fixtures.js";

const meta = {
    title: "Customization/Views and Theme",
    component: StoryCalendar,
    args: {
        date: ANCHOR_DATE,
        events: basicEvents,
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME
        }
    },
    argTypes: {
        events: { control: false },
        views: { control: false },
        style: { control: false }
    }
} satisfies Meta<typeof StoryCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegisteredView: Story = {
    render: (args) => <CustomViewExample {...args} />
};

export const CssTheme: Story = {
    args: {
        view: "week",
        className: "story-theme",
        style: {
            "--story-accent": "#0f766e"
        }
    }
};

export const ScrollbarTheme: Story = {
    args: {
        view: "week",
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME,
            slotSizing: { width: 180 }
        },
        style: {
            "--calendar-scrollbar-width": "auto",
            "--calendar-scrollbar-size": "16px",
            "--calendar-scrollbar-inset": "4px",
            "--calendar-scrollbar-thumb": "#0f766e",
            "--calendar-scrollbar-thumb-hover": "#115e59",
            "--calendar-scrollbar-track": "transparent"
        }
    },
    play: async ({ canvasElement }) => {
        const scrollRegion = canvasElement.querySelector<HTMLElement>(
            ".calendar-scroll-region"
        );

        if (!scrollRegion) {
            throw new Error("The themed scroll region did not render.");
        }

        const style = window.getComputedStyle(scrollRegion);
        const scrollbarStyle = window.getComputedStyle(
            scrollRegion,
            "::-webkit-scrollbar"
        );

        await expect(
            style.getPropertyValue("--calendar-scrollbar-thumb").trim()
        ).toBe("#0f766e");
        if (!navigator.userAgent.includes("Firefox")) {
            await expect(scrollbarStyle.height).toBe("16px");
        }
    }
};

export const TimeGridTheme: Story = {
    args: {
        view: "week",
        className: "themed-time-grid",
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME,
            slotSizing: { minWidth: 100 }
        },
        style: {
            "--calendar-time-grid-header-row-height": "42px",
            "--calendar-time-grid-line-width": "2px",
            "--calendar-time-grid-time-axis-width": "76px"
        }
    },
    play: async ({ canvasElement }) => {
        const calendar = canvasElement.querySelector<HTMLElement>(".calendar");
        const header = canvasElement.querySelector<HTMLElement>(".time-grid-view_header");
        const timeLabels = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_time-labels"
        );
        const slot = canvasElement.querySelector<HTMLElement>(".time-grid-view_slot");

        if (!calendar || !header || !timeLabels || !slot) {
            throw new Error("The themed time grid did not render.");
        }

        await expect(calendar).toHaveClass("themed-time-grid");
        await expect(window.getComputedStyle(header).gridTemplateRows).toBe("42px");
        await expect(window.getComputedStyle(timeLabels).width).toBe("76px");
        await expect(window.getComputedStyle(slot).borderRightWidth).toBe("2px");
    }
};
