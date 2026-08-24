import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, userEvent, within } from "storybook/test";

import { asCalendarDate } from "../../../src/index.js";
import { multiDayEvents } from "../../fixtures.js";
import {
    INTERACTION_META,
    TIME_GRID_VIEW_PROPS,
    getEventElement,
    getTimeGridViewProps
} from "./shared.js";

const meta = {
    ...INTERACTION_META,
    title: "Scenarios/Interactions/Resizing",
    parameters: {
        docs: {
            description: {
                component: "Event resizing by keyboard and touch, including cancellation, unsnapped boundaries, live geometry, and dedicated multi-day events."
            }
        }
    }
} satisfies Meta<typeof INTERACTION_META.component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Keyboard: Story = {
    args: {
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            resizeStep: 15
        }
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const handle = canvas.getByRole("slider", {
            name: /Resize end of Planning/i
        });
        const event = getEventElement(canvasElement, "Planning");
        const resizeValue = handle.querySelector<HTMLElement>(
            ".time-grid-view_resize-value"
        );
        if (!resizeValue) throw new Error("Could not find the resize value.");

        handle.focus();
        await expect(window.getComputedStyle(handle).outlineStyle).toBe("none");
        await expect(window.getComputedStyle(handle, "::before").height)
            .toBe("4px");
        await expect(window.getComputedStyle(event).boxShadow).not.toBe("none");
        await expect(window.getComputedStyle(resizeValue).visibility)
            .toBe("visible");
        await expect(resizeValue).toHaveTextContent("10:15 AM");
        await userEvent.keyboard("{ArrowDown}");
        await expect(event.style.gridRow).toBe("61 / 151");
        await expect(event).toHaveClass("is-resizing");
        await expect(handle).toHaveClass("is-active");
        await expect(resizeValue).toHaveTextContent("10:30 AM");
        await userEvent.keyboard("{Enter}");

        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent(
            "Resized Planning to 09:00–10:30"
        );
        await expect(
            getTimeGridViewProps(args)?.onEventResize
        ).toHaveBeenCalledWith(expect.objectContaining({
            edge: "end",
            start: asCalendarDate("2026-09-14T09:00:00", "UTC"),
            end: asCalendarDate("2026-09-14T10:30:00", "UTC")
        }));
    }
};

export const UnsnappedBoundaries: Story = {
    args: {
        events: [{
            id: "unsnapped",
            title: "Unsnapped event",
            start: "2026-09-14T09:10:00",
            end: "2026-09-14T09:50:00"
        }],
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            slotDuration: 30,
            resizeStep: 15
        }
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const startHandle = canvas.getByRole("slider", {
            name: /Resize start of Unsnapped event/i
        });
        const endHandle = canvas.getByRole("slider", {
            name: /Resize end of Unsnapped event/i
        });
        const startValue = asCalendarDate(
            "2026-09-14T09:10:00",
            "UTC"
        ).getTime();
        const endValue = asCalendarDate(
            "2026-09-14T09:50:00",
            "UTC"
        ).getTime();

        await expect(Number(startHandle.getAttribute("aria-valuemin")))
            .toBeLessThanOrEqual(startValue);
        await expect(Number(startHandle.getAttribute("aria-valuemax")))
            .toBeGreaterThanOrEqual(startValue);
        await expect(Number(endHandle.getAttribute("aria-valuemin")))
            .toBeLessThanOrEqual(endValue);
        await expect(Number(endHandle.getAttribute("aria-valuemax")))
            .toBeGreaterThanOrEqual(endValue);

        endHandle.focus();
        await userEvent.keyboard("{ArrowDown}");
        await expect(endHandle).toHaveAttribute(
            "aria-valuenow",
            String(asCalendarDate(
                "2026-09-14T10:00:00",
                "UTC"
            ).getTime())
        );
        await userEvent.keyboard("{Escape}");
        await expect(
            getTimeGridViewProps(args)?.onEventResize
        ).not.toHaveBeenCalled();
    }
};

export const CancelKeyboard: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const handle = canvas.getByRole("slider", {
            name: /Resize end of Planning/i
        });

        handle.focus();
        await userEvent.keyboard("{ArrowDown}{Escape}");

        await expect(
            getTimeGridViewProps(args)?.onEventResize
        ).not.toHaveBeenCalled();
    }
};

export const Touch: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const handle = canvas.getByRole("slider", {
            name: /Resize end of Planning/i
        });
        const destinationSlot = canvas.getByRole("button", {
            name: /Calendar slot.*10:00 AM/i
        });
        const handleBounds = handle.getBoundingClientRect();
        const destinationBounds = destinationSlot.getBoundingClientRect();
        const resizeValue = handle.querySelector<HTMLElement>(
            ".time-grid-view_resize-value"
        );
        if (!resizeValue) throw new Error("Could not find the resize value.");
        const pointer = {
            pointerId: 7,
            pointerType: "touch",
            isPrimary: true,
            clientX: handleBounds.left + (handleBounds.width / 2)
        };

        await fireEvent.pointerDown(handle, {
            ...pointer,
            clientY: handleBounds.top + (handleBounds.height / 2)
        });
        await fireEvent.pointerMove(handle, {
            ...pointer,
            clientY: destinationBounds.bottom
        });
        await expect(
            getEventElement(canvasElement, "Planning").style.gridRow
        ).toBe("61 / 181");
        await expect(handle).toHaveClass("is-active");
        await expect(window.getComputedStyle(resizeValue).visibility)
            .toBe("visible");
        await expect(resizeValue).toHaveTextContent("11:00 AM");
        await fireEvent.pointerUp(handle, {
            ...pointer,
            clientY: destinationBounds.bottom
        });

        await expect(
            getTimeGridViewProps(args)?.onEventResize
        ).toHaveBeenCalledOnce();
        await expect(getEventElement(canvasElement, "Planning"))
            .not.toHaveClass("is-resizing");
        await expect(handle).not.toHaveClass("is-active");
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
        const canvas = within(canvasElement);
        const event = getEventElement(canvasElement, "Design systems conference");
        const resizeHandle = canvas.getByRole("slider", {
            name: /Resize end of Design systems conference/i
        });
        const resizeValue = resizeHandle.querySelector<HTMLElement>(
            ".time-grid-view_resize-value"
        );
        if (!resizeValue) throw new Error("Could not find the resize value.");

        await expect(resizeHandle).toHaveAttribute("aria-orientation", "horizontal");
        resizeHandle.focus();
        await expect(window.getComputedStyle(resizeHandle).outlineStyle)
            .toBe("none");
        await expect(window.getComputedStyle(resizeHandle, "::before").width)
            .toBe("4px");
        await expect(window.getComputedStyle(event).boxShadow).not.toBe("none");
        await expect(resizeValue).toHaveTextContent(
            "Wednesday 16th, 11:00 AM"
        );
        await userEvent.keyboard("{ArrowRight}");
        await expect(event.style.gridColumn).toBe("2 / span 4");
        await expect(event).toHaveClass("is-resizing");
        await expect(resizeValue).toHaveTextContent(
            "Thursday 17th, 11:00 AM"
        );
        await userEvent.keyboard("{Enter}");
        await expect(
            getTimeGridViewProps(args)?.onEventResize
        ).toHaveBeenCalledWith(expect.objectContaining({
            edge: "end",
            start: asCalendarDate("2026-09-14T14:00:00", "UTC"),
            end: asCalendarDate("2026-09-17T11:00:00", "UTC")
        }));
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
        const canvas = within(canvasElement);
        const handle = canvas.getByRole("slider", {
            name: /Resize end of Design systems conference/i
        });
        const grid = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_multi-day-grid"
        );
        if (!grid) throw new Error("Could not find the dedicated event grid.");

        const gridBounds = grid.getBoundingClientRect();
        const handleBounds = handle.getBoundingClientRect();
        const columnWidth = gridBounds.width / 7;
        const grabX = handleBounds.left + handleBounds.width / 2;
        const destinationX = grabX + columnWidth;
        const clientY = handleBounds.top + handleBounds.height / 2;
        const onEventResize = getTimeGridViewProps(args)?.onEventResize;
        const resize = async (
            pointerId: number,
            pointerType: "mouse" | "touch"
        ) => {
            const pointer = { pointerId, pointerType, isPrimary: true, clientY };
            await fireEvent.pointerDown(handle, { ...pointer, clientX: grabX });
            await fireEvent.pointerMove(handle, { ...pointer, clientX: destinationX });
            await fireEvent.pointerUp(handle, { ...pointer, clientX: destinationX });
        };

        await resize(24, "mouse");
        await expect(onEventResize).toHaveBeenCalledTimes(1);
        await expect(onEventResize).toHaveBeenLastCalledWith(expect.objectContaining({
            edge: "end",
            start: asCalendarDate("2026-09-14T14:00:00", "UTC"),
            end: asCalendarDate("2026-09-17T11:00:00", "UTC")
        }));

        await resize(25, "touch");
        await expect(onEventResize).toHaveBeenCalledTimes(2);
        await expect(onEventResize).toHaveBeenLastCalledWith(expect.objectContaining({
            edge: "end",
            start: asCalendarDate("2026-09-14T14:00:00", "UTC"),
            end: asCalendarDate("2026-09-17T11:00:00", "UTC")
        }));
    }
};
