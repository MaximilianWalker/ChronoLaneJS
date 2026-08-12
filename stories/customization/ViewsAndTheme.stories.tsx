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
        minTime: MIN_TIME,
        maxTime: MAX_TIME
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
        cellWidth: 180,
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
        await expect(scrollbarStyle.height).toBe("16px");
    }
};
