import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import {
    INTERACTION_META,
    getTimeGridViewProps
} from "./shared.js";

const meta = {
    ...INTERACTION_META,
    title: "Scenarios/Interactions/Slot Selection",
    parameters: {
        docs: {
            description: {
                component: "Pointer selection of time-grid slots and the resulting selection callback contract."
            }
        }
    }
} satisfies Meta<typeof INTERACTION_META.component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pointer: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /Calendar slot.*10:00/i }));
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Selected slot at 10:00");
        await expect(getTimeGridViewProps(args)?.onSlotSelect).toHaveBeenCalledOnce();
    }
};
