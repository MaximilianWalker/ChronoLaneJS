import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, userEvent, within } from "storybook/test";

import { asCalendarDate } from "../../../src/index.js";
import {
    multiDayEvents,
    resourceConfig,
    resourceEvents
} from "../../fixtures.js";
import {
    INTERACTION_META,
    TIME_GRID_VIEW_PROPS,
    getEventElement,
    getTimeGridViewProps
} from "./shared.js";

const meta = {
    ...INTERACTION_META,
    title: "Scenarios/Interactions/Movement",
    parameters: {
        docs: {
            description: {
                component: "Event movement by pointer, touch, and keyboard, including cancellation, resource changes, and dedicated multi-day events."
            }
        }
    }
} satisfies Meta<typeof INTERACTION_META.component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pointer: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = getEventElement(canvasElement, "Planning");
        const slot = canvas.getByRole("button", { name: /Calendar slot.*1:00 PM/i });
        const eventBounds = event.getBoundingClientRect();
        const destinationBounds = slot.getBoundingClientRect();
        const pointer = {
            pointerId: 10,
            pointerType: "mouse",
            isPrimary: true,
            clientX: destinationBounds.left + (destinationBounds.width / 2),
            clientY: destinationBounds.top + 2
        };

        await fireEvent.pointerDown(event, {
            ...pointer,
            clientX: eventBounds.left + (eventBounds.width / 2),
            clientY: eventBounds.top + 2
        });
        await fireEvent.pointerMove(event, pointer);
        await expect(
            canvasElement.querySelector(".time-grid-view_move-preview")
        ).toBeVisible();
        await fireEvent.pointerUp(event, pointer);

        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Moved Planning to 13:00");
        await expect(getTimeGridViewProps(args)?.onEventDrop).toHaveBeenCalledOnce();
    }
};

export const Touch: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = getEventElement(canvasElement, "Planning");
        const slot = canvas.getByRole("button", { name: /Calendar slot.*1:00 PM/i });
        const eventBounds = event.getBoundingClientRect();
        const destinationBounds = slot.getBoundingClientRect();
        const pointer = {
            pointerId: 11,
            pointerType: "touch",
            isPrimary: true,
            clientX: destinationBounds.left + (destinationBounds.width / 2),
            clientY: destinationBounds.top + 2
        };

        await fireEvent.pointerDown(event, {
            ...pointer,
            clientX: eventBounds.left + (eventBounds.width / 2),
            clientY: eventBounds.top + 2
        });
        await fireEvent.pointerMove(event, pointer);
        await fireEvent.pointerUp(event, pointer);

        await expect(getTimeGridViewProps(args)?.onEventDrop).toHaveBeenCalledOnce();
    }
};

export const Keyboard: Story = {
    args: {
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            slotDuration: 30,
            labelInterval: 60
        }
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = getEventElement(canvasElement, "Planning");

        event.focus();
        await expect(window.getComputedStyle(event).outlineStyle).toBe("none");
        await expect(window.getComputedStyle(event).boxShadow).not.toBe("none");
        await expect(
            window.getComputedStyle(event, "::after").boxShadow
        ).not.toBe("none");
        await userEvent.keyboard("{ArrowDown}");
        await expect(canvas.getByRole("status")).toHaveTextContent(
            /Move Planning to Monday, September 14th, 2026, 9:30 AM/i
        );
        await userEvent.keyboard("{Enter}");

        await expect(getTimeGridViewProps(args)?.onEventDrop).toHaveBeenCalledWith(
            expect.objectContaining({
                start: asCalendarDate("2026-09-14T09:30:00", "UTC"),
                end: asCalendarDate("2026-09-14T10:45:00", "UTC")
            })
        );
    }
};

export const KeyboardAcrossResources: Story = {
    args: {
        events: resourceEvents.filter(({ id }) => id === "studio-session"),
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            resources: resourceConfig
        }
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = getEventElement(canvasElement, "Recording session");

        event.focus();
        await userEvent.keyboard("{ArrowRight}");
        await expect(canvas.getByRole("status")).toHaveTextContent(/Workshop/i);
        await userEvent.keyboard("{Enter}");

        await expect(getTimeGridViewProps(args)?.onEventDrop).toHaveBeenCalledOnce();
    }
};

export const CancelKeyboard: Story = {
    play: async ({ args, canvasElement }) => {
        const event = getEventElement(canvasElement, "Planning");

        event.focus();
        await userEvent.keyboard("{ArrowDown}{Escape}");

        await expect(getTimeGridViewProps(args)?.onEventDrop).not.toHaveBeenCalled();
    }
};

export const CancelPointer: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = getEventElement(canvasElement, "Planning");
        const slot = canvas.getByRole("button", { name: /Calendar slot.*1:00 PM/i });
        const destinationBounds = slot.getBoundingClientRect();
        const pointer = {
            pointerId: 12,
            pointerType: "touch",
            isPrimary: true,
            clientX: destinationBounds.left + (destinationBounds.width / 2),
            clientY: destinationBounds.top + (destinationBounds.height / 2)
        };

        await fireEvent.pointerDown(event, pointer);
        await fireEvent.pointerMove(event, pointer);
        await fireEvent.pointerCancel(event, pointer);

        await expect(
            canvasElement.querySelector(".time-grid-view_move-preview")
        ).toBeNull();
        await expect(getTimeGridViewProps(args)?.onEventDrop).not.toHaveBeenCalled();
    }
};

export const DedicatedMultiDayKeyboard: Story = {
    args: {
        view: "week",
        events: multiDayEvents.filter(({ id }) => id === "conference"),
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            multiDayEventLayout: "dedicated"
        }
    },
    play: async ({ args, canvasElement }) => {
        const event = getEventElement(canvasElement, "Design systems conference");

        event.focus();
        await userEvent.keyboard("{ArrowRight}");
        await expect(canvasElement.querySelector(
            ".time-grid-view_move-preview.is-multi-day"
        )).toBeVisible();
        await userEvent.keyboard("{Enter}");
        await expect(getTimeGridViewProps(args)?.onEventDrop).toHaveBeenCalledWith(
            expect.objectContaining({
                start: asCalendarDate("2026-09-15T14:00:00", "UTC"),
                end: asCalendarDate("2026-09-17T11:00:00", "UTC")
            })
        );
    }
};

export const DedicatedMultiDayPointer: Story = {
    args: {
        view: "week",
        events: multiDayEvents.filter(({ id }) => id === "conference"),
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            multiDayEventLayout: "dedicated"
        }
    },
    play: async ({ args, canvasElement }) => {
        const event = getEventElement(canvasElement, "Design systems conference");
        const grid = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_multi-day-grid"
        );
        if (!grid) throw new Error("Could not find the dedicated event grid.");

        const gridBounds = grid.getBoundingClientRect();
        const eventBounds = event.getBoundingClientRect();
        const columnWidth = gridBounds.width / 7;
        const grabX = eventBounds.left + eventBounds.width / 2;
        const destinationX = grabX + columnWidth;
        const clientY = eventBounds.top + eventBounds.height / 2;
        const onEventDrop = getTimeGridViewProps(args)?.onEventDrop;
        const drag = async (
            pointerId: number,
            pointerType: "mouse" | "touch",
            clientX: number
        ) => {
            const pointer = { pointerId, pointerType, isPrimary: true, clientY };
            await fireEvent.pointerDown(event, { ...pointer, clientX: grabX });
            await fireEvent.pointerMove(event, { ...pointer, clientX });
            await fireEvent.pointerUp(event, { ...pointer, clientX });
        };

        await drag(20, "mouse", grabX);
        await expect(onEventDrop).not.toHaveBeenCalled();
        await drag(21, "mouse", destinationX);
        await expect(onEventDrop).toHaveBeenCalledTimes(1);
        await expect(onEventDrop).toHaveBeenLastCalledWith(expect.objectContaining({
            start: asCalendarDate("2026-09-15T14:00:00", "UTC"),
            end: asCalendarDate("2026-09-17T11:00:00", "UTC")
        }));

        await drag(22, "touch", grabX);
        await expect(onEventDrop).toHaveBeenCalledTimes(1);
        await drag(23, "touch", destinationX);
        await expect(onEventDrop).toHaveBeenCalledTimes(2);
        await expect(onEventDrop).toHaveBeenLastCalledWith(expect.objectContaining({
            start: asCalendarDate("2026-09-15T14:00:00", "UTC"),
            end: asCalendarDate("2026-09-17T11:00:00", "UTC")
        }));
    }
};
