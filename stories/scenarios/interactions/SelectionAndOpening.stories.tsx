import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { asCalendarDate } from "../../../src/index.js";
import {
    multiDayEvents,
    overnightEvents,
    resourceConfig,
    resourceEvents
} from "../../fixtures.js";
import {
    INTERACTION_META,
    TIME_GRID_VIEW_PROPS,
    getEventElement,
    getEventElements
} from "./shared.js";

const meta = {
    ...INTERACTION_META,
    title: "Scenarios/Interactions/Selection and Opening",
    parameters: {
        docs: {
            description: {
                component: "Event selection and opening contracts across pointer, keyboard, clipped, overnight, multi-day, and resource occurrences."
            }
        }
    }
} satisfies Meta<typeof INTERACTION_META.component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PointerSelection: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = getEventElement(canvasElement, "Planning");
        await userEvent.click(event);
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Selected Planning");
        await expect(args.onEventSelect).toHaveBeenCalledOnce();

        const coveredSlot = canvas.getByRole("button", {
            name: "Calendar slot, Monday, September 14th, 2026, 9:00 AM"
        });
        coveredSlot.focus();
        await expect(coveredSlot).toHaveFocus();
        const eventBounds = event.getBoundingClientRect();
        const topElement = canvasElement.ownerDocument.elementFromPoint(
            eventBounds.left + (eventBounds.width / 2),
            eventBounds.top + (eventBounds.height / 2)
        );
        await expect(topElement?.closest(".time-grid-view_event-layer")).not.toBeNull();
    }
};

export const ClippedOccurrenceSelection: Story = {
    args: {
        date: "2026-09-15",
        events: multiDayEvents.filter(({ id }) => id === "conference")
    },
    play: async ({ args, canvasElement }) => {
        await userEvent.click(getEventElement(canvasElement, "Design systems conference"));
        await expect(args.onEventSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "conference",
                start: asCalendarDate("2026-09-14T14:00:00", "UTC"),
                end: asCalendarDate("2026-09-16T11:00:00", "UTC")
            }),
            expect.anything(),
            expect.objectContaining({
                view: "day",
                occurrence: {
                    day: asCalendarDate("2026-09-15", "UTC"),
                    resource: null,
                    resourceId: null
                }
            })
        );
    }
};

export const ClippedOccurrenceOpening: Story = {
    args: {
        date: "2026-09-15",
        events: multiDayEvents.filter(({ id }) => id === "conference")
    },
    play: async ({ args, canvasElement }) => {
        await userEvent.dblClick(getEventElement(canvasElement, "Design systems conference"));
        await expect(args.onEventOpen).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "conference",
                start: asCalendarDate("2026-09-14T14:00:00", "UTC"),
                end: asCalendarDate("2026-09-16T11:00:00", "UTC")
            }),
            expect.anything(),
            expect.objectContaining({
                view: "day",
                occurrence: {
                    day: asCalendarDate("2026-09-15", "UTC"),
                    resource: null,
                    resourceId: null
                }
            })
        );
    }
};

export const DedicatedMultiDaySelection: Story = {
    args: {
        view: "week",
        events: multiDayEvents.filter(({ id }) => id === "conference"),
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            multiDayEventLayout: "dedicated"
        }
    },
    play: async ({ args, canvasElement }) => {
        await userEvent.click(getEventElement(canvasElement, "Design systems conference"));
        await expect(args.onEventSelect).toHaveBeenCalledOnce();
    }
};

export const OvernightOccurrence: Story = {
    args: {
        date: "2026-09-15",
        events: overnightEvents,
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            minTime: "00:00",
            maxTime: "05:00"
        }
    },
    play: async ({ args, canvasElement }) => {
        await userEvent.click(getEventElement(canvasElement, "Release monitoring"));
        await expect(args.onEventSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "overnight",
                start: asCalendarDate("2026-09-14T23:00:00", "UTC"),
                end: asCalendarDate("2026-09-15T02:00:00", "UTC")
            }),
            expect.anything(),
            expect.objectContaining({
                view: "day",
                occurrence: {
                    day: asCalendarDate("2026-09-15", "UTC"),
                    resource: null,
                    resourceId: null
                }
            })
        );
    }
};

export const MultiResourceOccurrence: Story = {
    args: {
        view: "day",
        events: resourceEvents.filter(({ id }) => id === "shared-briefing"),
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            resources: resourceConfig
        }
    },
    play: async ({ args, canvasElement }) => {
        const [firstSegment] = getEventElements(canvasElement, "Shared briefing");
        await userEvent.click(firstSegment!);
        await expect(args.onEventSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "shared-briefing",
                resourceIds: ["studio", "workshop"],
                start: asCalendarDate("2026-09-14T11:30:00", "UTC"),
                end: asCalendarDate("2026-09-14T12:30:00", "UTC")
            }),
            expect.anything(),
            expect.objectContaining({
                view: "day",
                occurrence: {
                    day: asCalendarDate("2026-09-14", "UTC"),
                    resource: resourceConfig.items[0]!,
                    resourceId: "studio"
                }
            })
        );
    }
};

export const DoubleClick: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.dblClick(getEventElement(canvasElement, "Planning"));
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Opened Planning");
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
    }
};

export const Keyboard: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = getEventElement(canvasElement, "Planning");
        event.focus();
        await userEvent.keyboard("{Enter}");
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Opened Planning");
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
    }
};

export const AgendaKeyboard: Story = {
    args: {
        view: "agenda",
        viewProps: {}
    },
    play: async ({ args, canvasElement }) => {
        const event = getEventElement(canvasElement, "Planning");
        await expect(event).toHaveAttribute("aria-keyshortcuts", "Space Enter");
        event.focus();
        await expect(window.getComputedStyle(event).outlineStyle).toBe("none");
        await expect(window.getComputedStyle(event).boxShadow).not.toBe("none");
        await userEvent.keyboard("{Enter}");
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
    }
};

export const MonthKeyboard: Story = {
    args: {
        view: "month",
        viewProps: {}
    },
    play: async ({ args, canvasElement }) => {
        const event = getEventElement(canvasElement, "Planning");
        await expect(event).toHaveAttribute("aria-keyshortcuts", "Space Enter");
        event.focus();
        await expect(window.getComputedStyle(event).outlineStyle).toBe("none");
        await expect(window.getComputedStyle(event).boxShadow).not.toBe("none");
        await userEvent.keyboard("{Enter}");
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
    }
};
