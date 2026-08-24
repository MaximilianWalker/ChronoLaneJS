import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { InteractionHarness } from "../harnesses.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    MONTH_DATE,
    basicEvents,
    monthEvents
} from "../fixtures.js";

const assertSharedAccessibility = async (
    canvasElement: HTMLElement,
    previousName: RegExp,
    nextName: RegExp
) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole("button", { name: previousName });
    const next = canvas.getByRole("button", { name: nextName });
    const event = canvasElement.querySelector<HTMLElement>('[data-event-id="planning"]');

    if (!event) throw new Error("The accessibility audit event did not render.");

    previous.focus();
    await expect(previous).toHaveFocus();
    await expect(window.getComputedStyle(previous).outlineStyle).not.toBe("none");
    await expect(next).toBeEnabled();
    await expect(event.getAttribute("aria-label")).toMatch(/Planning.+Monday.+9:00 AM/i);

    return canvas;
};

const meta = {
    title: "Scenarios/Accessibility Audit",
    component: InteractionHarness,
    args: {
        date: ANCHOR_DATE,
        events: basicEvents,
        view: "day",
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME
        }
    },
    argTypes: {
        events: { control: false },
        views: { control: false },
        viewProps: { control: false }
    },
    parameters: {
        docs: {
            description: {
                component: "Canonical built-in-view surfaces for automated axe checks and the maintainer's manual accessibility release audit."
            }
        }
    }
} satisfies Meta<typeof InteractionHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Day: Story = {
    play: async ({ canvasElement }) => {
        const canvas = await assertSharedAccessibility(
            canvasElement,
            /previous day/i,
            /next day/i
        );

        await expect(canvas.getByRole("grid", { name: "Calendar grid" })).toBeVisible();
        await expect(canvas.getAllByRole("button", { name: /calendar slot/i }).length)
            .toBeGreaterThan(0);
    }
};

export const Week: Story = {
    args: {
        view: "week"
    },
    play: async ({ canvasElement }) => {
        const canvas = await assertSharedAccessibility(
            canvasElement,
            /previous week/i,
            /next week/i
        );

        await expect(canvas.getByRole("grid", { name: "Calendar grid" })).toBeVisible();
        await expect(canvas.getAllByRole("columnheader")).toHaveLength(7);
    }
};

export const Month: Story = {
    args: {
        date: MONTH_DATE,
        events: monthEvents,
        view: "month",
        viewProps: {}
    },
    play: async ({ canvasElement }) => {
        const canvas = await assertSharedAccessibility(
            canvasElement,
            /previous month/i,
            /next month/i
        );

        await expect(
            canvas.getByRole("grid", { name: "Month calendar grid" })
        ).toBeVisible();
        await expect(
            canvas.getByRole("button", { name: /Monday, September 14th, 2026/i })
        ).toBeVisible();
    }
};

export const Agenda: Story = {
    args: {
        view: "agenda",
        viewProps: { range: 14 }
    },
    play: async ({ canvasElement }) => {
        const canvas = await assertSharedAccessibility(
            canvasElement,
            /previous agenda range/i,
            /next agenda range/i
        );

        await expect(
            canvas.getByRole("heading", { name: /Monday, September 14th, 2026/i })
        ).toBeVisible();
    }
};

export const CustomTimeGrid: Story = {
    args: {
        view: "time-grid",
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME,
            range: 3
        }
    },
    play: async ({ canvasElement }) => {
        const canvas = await assertSharedAccessibility(
            canvasElement,
            /previous range/i,
            /next range/i
        );

        await expect(canvas.getByRole("grid", { name: "Calendar grid" })).toBeVisible();
        await expect(canvas.getAllByRole("columnheader")).toHaveLength(3);
    }
};
