import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { InteractionHarness } from "../../harnesses.js";
import { resourceConfig } from "../../fixtures.js";
import {
    INTERACTION_META,
    TIME_GRID_VIEW_PROPS,
    getTimeGridViewProps
} from "./shared.js";

const meta = {
    ...INTERACTION_META,
    title: "Scenarios/Interactions/Keyboard Navigation",
    parameters: {
        docs: {
            description: {
                component: "Roving focus, spatial navigation, selection, and tab entry and exit behavior for time-grid slots."
            }
        }
    }
} satisfies Meta<typeof INTERACTION_META.component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TimeGridSlots: Story = {
    args: {
        events: [],
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            resources: resourceConfig,
            slotDuration: 30,
            labelInterval: 60
        }
    },
    render: (args) => (
        <>
            <InteractionHarness {...args} />
            <button type="button" data-testid="after-calendar">
                After calendar
            </button>
        </>
    ),
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const grid = canvas.getByRole("grid", { name: "Calendar grid" });
        const slots = within(grid).getAllByRole("button");
        const cells = within(grid).getAllByRole("gridcell");
        const rows = within(grid).getAllByRole("row");
        const headers = within(grid).getAllByRole("columnheader");
        const wrapper = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid-wrapper"
        );

        await expect(wrapper).not.toHaveAttribute("tabindex");
        await expect(headers).toHaveLength(3);
        await expect(headers[0]).toHaveAccessibleName(/Monday.*Studio/i);
        await expect(headers[1]).toHaveAccessibleName(/Monday.*Workshop/i);
        await expect(headers[2]).toHaveAccessibleName(/Monday.*Terrace/i);
        await expect(rows).toHaveLength(21);
        await expect(cells).toHaveLength(60);
        await expect(slots.filter(({ tabIndex }) => tabIndex === 0)).toEqual([
            slots[0]
        ]);

        slots[0]?.focus();
        const firstCell = slots[0]?.closest<HTMLElement>(
            ".time-grid-view_slot-cell"
        );
        if (!slots[0] || !firstCell) {
            throw new Error("The first navigable calendar slot did not render.");
        }
        await expect(window.getComputedStyle(slots[0]).outlineStyle).toBe("none");
        await expect(
            window.getComputedStyle(firstCell, "::after").boxShadow
        ).not.toBe("none");
        await userEvent.keyboard("{ArrowRight}");
        await expect(slots[1]).toHaveFocus();
        await userEvent.keyboard("{ArrowDown}");
        await expect(slots[4]).toHaveFocus();
        await userEvent.keyboard("{Home}");
        await expect(slots[3]).toHaveFocus();
        await userEvent.keyboard("{End}");
        await expect(slots[5]).toHaveFocus();
        await userEvent.keyboard("{Control>}{Home}{/Control}");
        await expect(slots[0]).toHaveFocus();
        await userEvent.keyboard("{Control>}{End}{/Control}");
        await expect(slots.at(-1)).toHaveFocus();
        await userEvent.keyboard("{Enter}");
        await expect(getTimeGridViewProps(args)?.onSlotSelect).toHaveBeenCalledOnce();
        await expect(cells.at(-1)).toHaveAttribute("aria-selected", "true");

        await userEvent.tab();
        await expect(canvas.getByTestId("after-calendar")).toHaveFocus();
        await userEvent.tab({ shift: true });
        await expect(slots.at(-1)).toHaveFocus();
    }
};
