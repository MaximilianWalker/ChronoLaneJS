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
import type { TimeGridViewProps } from "../../src/index.js";
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
import type { StoryEvent, StoryResource } from "../fixtures.js";

const CUSTOM_RENDERER_COMPONENTS = {
    event: CustomTimeGridEvent,
    slot: CustomSlot
};
const TIME_GRID_VIEW_PROPS = {
    minTime: MIN_TIME,
    maxTime: MAX_TIME,
    onEventDrop: fn(),
    onEventResize: fn(),
    onSlotSelect: fn()
} as const;
const getTimeGridViewProps = (args: { viewProps?: unknown }) => (
    args.viewProps as Partial<TimeGridViewProps<StoryEvent, StoryResource>> | undefined
);
const EVENT_SELECTOR = ".time-grid-view_event, .agenda-view_event, .month-view_event";
const getEventElements = (
    canvasElement: HTMLElement,
    title: string
): HTMLElement[] => [...canvasElement.querySelectorAll<HTMLElement>(EVENT_SELECTOR)].filter(
    (element) => element.getAttribute("aria-label")?.includes(title)
        || element.textContent?.includes(title)
);
const getEventElement = (
    canvasElement: HTMLElement,
    title: string
): HTMLElement => {
    const [element] = getEventElements(canvasElement, title);
    if (!element) throw new Error(`Could not find the rendered event "${title}".`);
    return element;
};

const meta = {
    title: "Scenarios/Interactions",
    component: InteractionHarness,
    args: {
        view: "day",
        date: ANCHOR_DATE,
        events: basicEvents,
        viewProps: TIME_GRID_VIEW_PROPS,
        onEventOpen: fn(),
        onEventSelect: fn()
    },
    argTypes: {
        canOpenEvent: { control: false },
        events: { control: false },
        onEventOpen: { control: false },
        onEventSelect: { control: false },
        viewProps: { control: false }
    }
} satisfies Meta<typeof InteractionHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectEvent: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(getEventElement(canvasElement, "Planning"));
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

export const OpenClippedEvent: Story = {
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

export const SelectOvernightEvent: Story = {
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

export const SelectMultiResourceEvent: Story = {
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

export const SelectSlot: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: /Calendar slot.*10:00/i }));
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Selected slot at 10:00");
        await expect(getTimeGridViewProps(args)?.onSlotSelect).toHaveBeenCalledOnce();
    }
};

export const InteractionsWithoutGridLines: Story = {
    args: {
        style: {
            "--calendar-time-grid-line-width": "0px"
        }
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const grid = canvas.getByLabelText("Calendar grid");
        const slot = grid.querySelector<HTMLElement>(".time-grid-view_slot");
        const header = grid.querySelector<HTMLElement>(".time-grid-view_header");
        const headerCell = grid.querySelector<HTMLElement>(
            ".time-grid-view_header-cell"
        );
        const selectedSlot = canvas.getByRole("button", { name: /Calendar slot.*10:00/i });
        const moveHandle = canvas.getByRole("button", { name: "Move Planning" });

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

        moveHandle.focus();
        await userEvent.keyboard("{ArrowDown}{Enter}");
        await expect(getTimeGridViewProps(args)?.onEventDrop).toHaveBeenCalledOnce();
    }
};

export const DoubleClickToOpen: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.dblClick(getEventElement(canvasElement, "Planning"));
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Opened Planning");
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
    }
};

export const KeyboardOpen: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const event = getEventElement(canvasElement, "Planning");
        event.focus();
        await userEvent.keyboard("{Enter}");
        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Opened Planning");
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
    }
};

export const RawInteractionsAreAdditive: Story = {
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
        await expect(event).toHaveAttribute("aria-keyshortcuts", "Space Enter E");

        await userEvent.dblClick(event);
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
        await expect(args.eventInteractions?.onDoubleClick).toHaveBeenCalledOnce();
    }
};

export const KeyboardResize: Story = {
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

        handle.focus();
        await userEvent.keyboard("{ArrowDown}");
        await expect(
            canvasElement.querySelector<HTMLElement>(".time-grid-view_resize-preview")
                ?.style.gridRow
        ).toBe("61 / 151");
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

export const UnsnappedResizeBoundaries: Story = {
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

export const CancelKeyboardResize: Story = {
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

export const TouchResize: Story = {
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
            canvasElement.querySelector<HTMLElement>(".time-grid-view_resize-preview")
                ?.style.gridRow
        ).toBe("61 / 181");
        await fireEvent.pointerUp(handle, {
            ...pointer,
            clientY: destinationBounds.bottom
        });

        await expect(
            getTimeGridViewProps(args)?.onEventResize
        ).toHaveBeenCalledOnce();
        await expect(
            canvasElement.querySelector(".time-grid-view_resize-preview")
        ).toBeNull();
    }
};

export const EventSpecificPermissions: Story = {
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
        await expect(canvasElement.querySelector(
            '[data-event-id="planning"].time-grid-view_event-move-handle'
        )).toBeNull();
        await userEvent.click(planning);
        await expect(args.onEventSelect).not.toHaveBeenCalled();
        await userEvent.dblClick(planning);
        await expect(args.onEventOpen).not.toHaveBeenCalled();

        await expect(designReview).not.toHaveAttribute("draggable");
        await expect(canvasElement.querySelector(
            '[data-event-id="design-review"].time-grid-view_event-move-handle'
        )).toBeVisible();
        await userEvent.click(designReview);
        await expect(args.onEventSelect).toHaveBeenCalledOnce();
        await userEvent.dblClick(designReview);
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
    }
};

export const AgendaKeyboardOpen: Story = {
    args: {
        view: "agenda",
        viewProps: {}
    },
    play: async ({ args, canvasElement }) => {
        const event = getEventElement(canvasElement, "Planning");
        await expect(event).toHaveAttribute("aria-keyshortcuts", "Space Enter");
        event.focus();
        await userEvent.keyboard("{Enter}");
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
    }
};

export const MonthKeyboardOpen: Story = {
    args: {
        view: "month",
        viewProps: {}
    },
    play: async ({ args, canvasElement }) => {
        const event = getEventElement(canvasElement, "Planning");
        await expect(event).toHaveAttribute("aria-keyshortcuts", "Space Enter");
        event.focus();
        await userEvent.keyboard("{Enter}");
        await expect(args.onEventOpen).toHaveBeenCalledOnce();
    }
};

export const CustomRendererKeyboardOpen: Story = {
    args: {
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            components: CUSTOM_RENDERER_COMPONENTS
        }
    },
    play: async ({ args, canvasElement }) => {
        const event = getEventElement(canvasElement, "Planning");
        await expect(event).toHaveAttribute("aria-keyshortcuts", "Space Enter");
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
        await expect(canvas.getByRole("button", {
            name: "Move Planning"
        })).toBeVisible();
        await userEvent.click(event);
        await expect(args.onEventSelect).toHaveBeenCalledOnce();

        await expect(slot).toHaveClass("story-slot");
        await expect(slot).toHaveAttribute("data-story-day", "2026-09-14");
        await userEvent.click(slot);
        await expect(getTimeGridViewProps(args)?.onSlotSelect).toHaveBeenCalledOnce();
    }
};

export const PointerMoveToSlot: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const handle = canvas.getByRole("button", { name: "Move Planning" });
        const slot = canvas.getByRole("button", { name: /Calendar slot.*1:00 PM/i });
        const handleBounds = handle.getBoundingClientRect();
        const destinationBounds = slot.getBoundingClientRect();
        const pointer = {
            pointerId: 10,
            pointerType: "mouse",
            isPrimary: true,
            clientX: destinationBounds.left + (destinationBounds.width / 2),
            clientY: destinationBounds.top + (destinationBounds.height / 2)
        };

        await fireEvent.pointerDown(handle, {
            ...pointer,
            clientX: handleBounds.left + (handleBounds.width / 2),
            clientY: handleBounds.top + (handleBounds.height / 2)
        });
        await fireEvent.pointerMove(handle, pointer);
        await expect(
            canvasElement.querySelector(".time-grid-view_move-preview")
        ).toBeVisible();
        await fireEvent.pointerUp(handle, pointer);

        await expect(canvas.getByTestId("interaction-log")).toHaveTextContent("Moved Planning to 13:00");
        await expect(getTimeGridViewProps(args)?.onEventDrop).toHaveBeenCalledOnce();
    }
};

export const TouchMoveToSlot: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const handle = canvas.getByRole("button", { name: "Move Planning" });
        const slot = canvas.getByRole("button", { name: /Calendar slot.*1:00 PM/i });
        const handleBounds = handle.getBoundingClientRect();
        const destinationBounds = slot.getBoundingClientRect();
        const pointer = {
            pointerId: 11,
            pointerType: "touch",
            isPrimary: true,
            clientX: destinationBounds.left + (destinationBounds.width / 2),
            clientY: destinationBounds.top + (destinationBounds.height / 2)
        };

        await fireEvent.pointerDown(handle, {
            ...pointer,
            clientX: handleBounds.left + (handleBounds.width / 2),
            clientY: handleBounds.top + (handleBounds.height / 2)
        });
        await fireEvent.pointerMove(handle, pointer);
        await fireEvent.pointerUp(handle, pointer);

        await expect(getTimeGridViewProps(args)?.onEventDrop).toHaveBeenCalledOnce();
    }
};

export const KeyboardMove: Story = {
    args: {
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            slotDuration: 30,
            labelInterval: 60
        }
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const handle = canvas.getByRole("button", { name: "Move Planning" });

        handle.focus();
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

export const KeyboardMoveAcrossResources: Story = {
    args: {
        events: resourceEvents.filter(({ id }) => id === "studio-session"),
        viewProps: {
            ...TIME_GRID_VIEW_PROPS,
            resources: resourceConfig
        }
    },
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const handle = canvas.getByRole("button", { name: "Move Recording session" });

        handle.focus();
        await userEvent.keyboard("{ArrowRight}");
        await expect(canvas.getByRole("status")).toHaveTextContent(/Workshop/i);
        await userEvent.keyboard("{Enter}");

        await expect(getTimeGridViewProps(args)?.onEventDrop).toHaveBeenCalledOnce();
    }
};

export const CancelKeyboardMove: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const handle = canvas.getByRole("button", { name: "Move Planning" });

        handle.focus();
        await userEvent.keyboard("{ArrowDown}{Escape}");

        await expect(getTimeGridViewProps(args)?.onEventDrop).not.toHaveBeenCalled();
    }
};

export const CancelPointerMove: Story = {
    play: async ({ args, canvasElement }) => {
        const canvas = within(canvasElement);
        const handle = canvas.getByRole("button", { name: "Move Planning" });
        const slot = canvas.getByRole("button", { name: /Calendar slot.*1:00 PM/i });
        const destinationBounds = slot.getBoundingClientRect();
        const pointer = {
            pointerId: 12,
            pointerType: "touch",
            isPrimary: true,
            clientX: destinationBounds.left + (destinationBounds.width / 2),
            clientY: destinationBounds.top + (destinationBounds.height / 2)
        };

        await fireEvent.pointerDown(handle, pointer);
        await fireEvent.pointerMove(handle, pointer);
        await fireEvent.pointerCancel(handle, pointer);

        await expect(
            canvasElement.querySelector(".time-grid-view_move-preview")
        ).toBeNull();
        await expect(getTimeGridViewProps(args)?.onEventDrop).not.toHaveBeenCalled();
    }
};
