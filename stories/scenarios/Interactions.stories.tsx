import type { Meta, StoryObj } from "@storybook/react-vite";
import {
    expect,
    fireEvent,
    fn,
    userEvent,
    within
} from "storybook/test";

import {
    CustomSlot,
    CustomTimeGridEvent,
    InteractionHarness
} from "../harnesses.js";
import { asCalendarDate } from "../../src/index.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents,
    multiDayEvents,
    overnightEvents,
    resourceConfig,
    resourceEvents,
} from "../fixtures.js";

const CUSTOM_RENDERER_COMPONENTS = {
    event: CustomTimeGridEvent,
    slot: CustomSlot
};

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
        onEventSelect: fn(),
        onSlotSelect: fn()
    },
    argTypes: {
        canDragEvent: { control: false },
        canEditEvent: { control: false },
        events: { control: false },
        onEventDrop: { control: false },
        onEventEdit: { control: false },
        onEventSelect: { control: false },
        onSlotSelect: { control: false }
    }
} satisfies Meta<typeof InteractionHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectEvent: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /Planning/i }));
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Selected Planning");
        await expect(args.onEventSelect).toHaveBeenCalledOnce();
    }
};

export const SelectClippedEvent: Story = {
    args: {
        date: "2026-09-15",
        events: multiDayEvents.filter(({ id }) => id === "conference")
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /Design systems conference/i }));
        await expect(args.onEventSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "conference",
                start: asCalendarDate("2026-09-14T14:00:00", "Europe/Lisbon"),
                end: asCalendarDate("2026-09-16T11:00:00", "Europe/Lisbon")
            }),
            expect.anything()
        );
    }
};

export const EditClippedEvent: Story = {
    args: {
        date: "2026-09-15",
        events: multiDayEvents.filter(({ id }) => id === "conference")
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.dblClick(canvas.getByRole("button", { name: /Design systems conference/i }));
        await expect(args.onEventEdit).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "conference",
                start: asCalendarDate("2026-09-14T14:00:00", "Europe/Lisbon"),
                end: asCalendarDate("2026-09-16T11:00:00", "Europe/Lisbon")
            }),
            expect.anything()
        );
    }
};

export const SelectOvernightEvent: Story = {
    args: {
        date: "2026-09-15",
        events: overnightEvents,
        minTime: "00:00",
        maxTime: "05:00"
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /Release monitoring/i }));
        await expect(args.onEventSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "overnight",
                start: asCalendarDate("2026-09-14T23:00:00", "Europe/Lisbon"),
                end: asCalendarDate("2026-09-15T02:00:00", "Europe/Lisbon")
            }),
            expect.anything()
        );
    }
};

export const SelectMultiResourceEvent: Story = {
    args: {
        view: "day",
        events: resourceEvents.filter(({ id }) => id === "shared-briefing"),
        resources: resourceConfig
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const [firstSegment] = canvas.getAllByRole("button", { name: /Shared briefing/i });
        await userEvent.click(firstSegment!);
        await expect(args.onEventSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "shared-briefing",
                resourceIds: ["studio", "workshop"],
                start: asCalendarDate("2026-09-14T11:30:00", "Europe/Lisbon"),
                end: asCalendarDate("2026-09-14T12:30:00", "Europe/Lisbon")
            }),
            expect.anything()
        );
    }
};

export const SelectSlot: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /Calendar slot.*10:00/i }));
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Selected slot at 10:00");
        await expect(args.onSlotSelect).toHaveBeenCalledOnce();
    }
};

export const InteractionsWithoutGridLines: Story = {
    args: {
        showGridLines: false
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const grid = canvas.getByLabelText("Calendar grid");
        const selectedSlot = canvas.getByRole("button", { name: /Calendar slot.*10:00/i });
        const dropSlot = canvas.getByRole("button", { name: /Calendar slot.*1:00 PM/i });
        const event = canvas.getByRole("button", { name: /Planning/i });

        await expect(grid).not.toHaveClass("has-grid-lines");
        await userEvent.click(selectedSlot);
        await expect(args.onSlotSelect).toHaveBeenCalledOnce();

        await fireEvent.dragStart(event);
        await fireEvent.drop(dropSlot);
        await expect(args.onEventDrop).toHaveBeenCalledOnce();
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

export const EventSpecificPermissions: Story = {
    args: {
        canEditEvent: (event) => event.id === "design-review",
        canDragEvent: (event) => event.id === "design-review"
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const planning = canvas.getByRole("button", { name: /Planning/i });
        const designReview = canvas.getByRole("button", { name: /Design review/i });

        await expect(planning).not.toHaveAttribute("draggable", "true");
        await userEvent.dblClick(planning);
        await expect(args.onEventEdit).not.toHaveBeenCalled();

        await expect(designReview).toHaveAttribute("draggable", "true");
        await userEvent.dblClick(designReview);
        await expect(args.onEventEdit).toHaveBeenCalledOnce();
    }
};

export const AgendaKeyboardEdit: Story = {
    args: {
        view: "agenda"
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = canvas.getByRole("button", { name: /Planning/i });
        await expect(event).toHaveAttribute("aria-keyshortcuts", "Shift+Enter");
        event.focus();
        await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
        await expect(args.onEventEdit).toHaveBeenCalledOnce();
    }
};

export const MonthKeyboardEdit: Story = {
    args: {
        view: "month"
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = canvas.getByRole("button", { name: /Planning/i });
        await expect(event).toHaveAttribute("aria-keyshortcuts", "Shift+Enter");
        event.focus();
        await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
        await expect(args.onEventEdit).toHaveBeenCalledOnce();
    }
};

export const CustomRendererKeyboardEdit: Story = {
    args: {
        components: CUSTOM_RENDERER_COMPONENTS
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = canvas.getByRole("button", { name: /Planning/i });
        await expect(event).toHaveAttribute("aria-keyshortcuts", "Shift+Enter");
        event.focus();
        await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
        await expect(args.onEventEdit).toHaveBeenCalledOnce();
    }
};

export const CustomRendererSelection: Story = {
    args: {
        components: CUSTOM_RENDERER_COMPONENTS
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = canvas.getByRole("button", { name: /Planning/i });
        const slot = canvas.getByRole("button", { name: /Calendar slot.*10:00/i });

        await expect(event).toHaveClass("story-event");
        await expect(event).toHaveAttribute("data-story-day-index", "0");
        await userEvent.click(event);
        await expect(args.onEventSelect).toHaveBeenCalledOnce();

        await expect(slot).toHaveClass("story-slot");
        await expect(slot).toHaveAttribute("data-story-day-index", "0");
        await userEvent.click(slot);
        await expect(args.onSlotSelect).toHaveBeenCalledOnce();
    }
};

export const DragToSlot: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = canvas.getByRole("button", { name: /Planning/i });
        const slot = canvas.getByRole("button", { name: /Calendar slot.*1:00 PM/i });
        await fireEvent.dragStart(event);
        await fireEvent.drop(slot);
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Dropped Planning at 13:00");
        await expect(args.onEventDrop).toHaveBeenCalledOnce();
    }
};

export const CancelledDrag: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = canvas.getByRole("button", { name: /Planning/i });
        const slot = canvas.getByRole("button", { name: /Calendar slot.*1:00 PM/i });
        await fireEvent.dragStart(event);
        await fireEvent.dragEnd(event);
        await fireEvent.drop(slot);
        await expect(args.onEventDrop).not.toHaveBeenCalled();
    }
};

export const IgnoreDropOutsideSlot: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = canvas.getByRole("button", { name: /Planning/i });
        const grid = canvas.getByLabelText("Calendar grid");
        await fireEvent.dragStart(event);
        await fireEvent.drop(grid);
        await expect(args.onEventDrop).not.toHaveBeenCalled();
    }
};
