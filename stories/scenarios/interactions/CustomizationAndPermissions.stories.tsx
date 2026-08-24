import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
    CUSTOM_RENDERER_COMPONENTS,
    INTERACTION_META,
    TIME_GRID_VIEW_PROPS,
    getEventElement,
    getTimeGridViewProps
} from "./shared.js";

const meta = {
    ...INTERACTION_META,
    title: "Scenarios/Interactions/Customization and Permissions",
    parameters: {
        docs: {
            description: {
                component: "Interaction composition with raw handlers, per-event permissions, custom renderers, and presentation overrides."
            }
        }
    }
} satisfies Meta<typeof INTERACTION_META.component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RawHandlers: Story = {
    args: {
        eventInteractions: {
            onClick: fn(),
            onDoubleClick: fn(),
            onContextMenu: fn(),
            onKeyDown: fn(),
            ariaKeyShortcuts: "E"
        }
    },
    play: async ({ args, canvasElement }) => {
        const event = getEventElement(canvasElement, "Planning");

        await userEvent.click(event);
        await expect(args.onEventSelect).toHaveBeenCalledOnce();
        await expect(args.eventInteractions?.onClick).toHaveBeenCalledOnce();
        await expect(event).toHaveAttribute(
            "aria-keyshortcuts",
            "Space Enter E ArrowUp ArrowDown ArrowLeft ArrowRight Escape"
        );

        await userEvent.dblClick(event);
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
        await expect(args.eventInteractions?.onDoubleClick).toHaveBeenCalledOnce();
    }
};

export const PerEventPermissions: Story = {
    args: {
        canSelectEvent: (event) => event.id === "design-review",
        canOpenEvent: (event) => event.id === "design-review",
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            canDragEvent: (event) => event.id === "design-review"
        }
    },
    play: async ({ args, canvasElement }) => {
        const planning = getEventElement(canvasElement, "Planning");
        const designReview = getEventElement(canvasElement, "Design review");

        await expect(planning).not.toHaveAttribute("draggable");
        await expect(planning).not.toHaveClass("is-movable");
        await userEvent.click(planning);
        await expect(args.onEventSelect).not.toHaveBeenCalled();
        await userEvent.dblClick(planning);
        await expect(args.onEventOpen).not.toHaveBeenCalled();

        await expect(designReview).not.toHaveAttribute("draggable");
        await expect(designReview).toHaveClass("is-movable");
        await userEvent.click(designReview);
        await expect(args.onEventSelect).toHaveBeenCalledOnce();
        await userEvent.dblClick(designReview);
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
    }
};

export const CustomRendererOpening: Story = {
    args: {
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            components: CUSTOM_RENDERER_COMPONENTS
        }
    },
    play: async ({ args, canvasElement }) => {
        const event = getEventElement(canvasElement, "Planning");
        await expect(event).toHaveAttribute(
            "aria-keyshortcuts",
            "Space Enter ArrowUp ArrowDown ArrowLeft ArrowRight Escape"
        );
        event.focus();
        await userEvent.keyboard("{Enter}");
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
    }
};

export const CustomRendererSelection: Story = {
    args: {
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            components: CUSTOM_RENDERER_COMPONENTS
        }
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = getEventElement(canvasElement, "Planning");
        const slot = canvas.getByRole("button", { name: /Calendar slot.*10:00/i });

        await expect(event).toHaveClass("story-event");
        await expect(event).toHaveAttribute("data-story-day", "2026-09-14");
        await expect(canvas.getByRole("slider", {
            name: /Resize end of Planning/i
        })).toBeVisible();
        await expect(event).toHaveClass("is-movable");
        await expect(canvas.queryByRole("button", {
            name: "Move Planning"
        })).not.toBeInTheDocument();
        await userEvent.click(event);
        await expect(args.onEventSelect).toHaveBeenCalledOnce();

        await expect(slot).toHaveClass("story-slot");
        await expect(slot).toHaveAttribute("data-story-day", "2026-09-14");
        await userEvent.click(slot);
        await expect(getTimeGridViewProps(args)?.onSlotSelect).toHaveBeenCalledOnce();

        await userEvent.keyboard("{ArrowDown}");
        const nextSlot = canvas.getByRole("button", {
            name: /Calendar slot.*11:00 AM/i
        });
        await expect(nextSlot).toHaveFocus();
        await userEvent.keyboard(" ");
        await expect(getTimeGridViewProps(args)?.onSlotSelect).toHaveBeenCalledTimes(2);
    }
};

export const HiddenGridLines: Story = {
    args: {
        style: {
            "--calendar-time-grid-line-width": "0px"
        }
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const grid = canvas.getByLabelText("Calendar grid");
        const slot = grid.querySelector<HTMLElement>(".time-grid-view_slot");
        const header = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_header"
        );
        const headerCell = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_header-cell"
        );
        const selectedSlot = canvas.getByRole("button", { name: /Calendar slot.*10:00/i });
        const event = getEventElement(canvasElement, "Planning");

        if (!slot || !header || !headerCell) {
            throw new Error("The time-grid presentation did not render.");
        }

        await expect(window.getComputedStyle(slot).borderRightWidth).toBe("0px");
        await expect(window.getComputedStyle(headerCell).borderLeftWidth).toBe("0px");
        await expect(
            window.getComputedStyle(header, "::before").borderBottomWidth
        ).toBe("0px");
        await userEvent.click(selectedSlot);
        await expect(getTimeGridViewProps(args)?.onSlotSelect).toHaveBeenCalledOnce();

        event.focus();
        await userEvent.keyboard("{ArrowDown}{Enter}");
        await expect(getTimeGridViewProps(args)?.onEventDrop).toHaveBeenCalledOnce();
    }
};
