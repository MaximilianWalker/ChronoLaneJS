import type { Meta, StoryObj } from "@storybook/react-vite";
import {
    expect,
    fireEvent,
    fn,
    userEvent,
    within
} from "storybook/test";

import { InteractionHarness } from "../harnesses.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents
} from "../fixtures.js";

const meta = {
    title: "Scenarios/Interactions",
    component: InteractionHarness,
    args: {
        view: "day",
        date: ANCHOR_DATE,
        events: basicEvents,
        minTime: MIN_TIME,
        maxTime: MAX_TIME,
        onEventDrop: fn(),
        onEventEdit: fn(),
        onSelectEvent: fn(),
        onSelectSlot: fn()
    },
    argTypes: {
        events: { control: false },
        onEventDrop: { control: false },
        onEventEdit: { control: false },
        onSelectEvent: { control: false },
        onSelectSlot: { control: false }
    }
} satisfies Meta<typeof InteractionHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectEvent: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /Planning/i }));
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Selected Planning");
        await expect(args.onSelectEvent).toHaveBeenCalledOnce();
    }
};

export const SelectSlot: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /Calendar slot.*10:00/i }));
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Selected slot at 10:00");
        await expect(args.onSelectSlot).toHaveBeenCalledOnce();
    }
};

export const DoubleClickToEdit: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.dblClick(canvas.getByRole("button", { name: /Planning/i }));
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Editing Planning");
        await expect(args.onEventEdit).toHaveBeenCalledOnce();
    }
};

export const KeyboardEdit: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = canvas.getByRole("button", { name: /Planning/i });
        event.focus();
        await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Editing Planning");
        await expect(args.onEventEdit).toHaveBeenCalledOnce();
    }
};

export const DragToSlot: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = canvas.getByRole("button", { name: /Planning/i });
        const slot = canvas.getByRole("button", { name: /Calendar slot.*13:00/i });
        await fireEvent.dragStart(event);
        await fireEvent.drop(slot);
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Dropped Planning at 13:00");
        await expect(args.onEventDrop).toHaveBeenCalledOnce();
    }
};
