import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { asCalendarDate } from "../../src/index.js";
import type { CalendarRange } from "../../src/index.js";
import {
    ControlledNavigation,
    StoryCalendar
} from "../harnesses.js";
import type { StoryCalendarProps } from "../harnesses.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME
} from "../fixtures.js";

const TIME_ZONE = "Europe/Lisbon";

const calendarDate = (monthIndex: number, day: number): Date => (
    asCalendarDate(
        `2026-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        TIME_ZONE
    )
);

const calendarRange = (
    start: Date,
    end: Date,
    metadata: Record<string, Date> = {}
): CalendarRange => ({
    start,
    end,
    days: eachDayOfInterval({ start, end }),
    ...metadata
});

const expectNavigation = async ({
    args,
    buttonName,
    canvasElement,
    initialRange,
    nextDate,
    nextRange
}: {
    args: Pick<StoryCalendarProps, "onDateChange" | "onRangeChange">;
    buttonName: string;
    canvasElement: HTMLElement;
    initialRange: CalendarRange;
    nextDate: Date;
    nextRange: CalendarRange;
}) => {
    const { onDateChange, onRangeChange } = args;
    if (!onDateChange || !onRangeChange) {
        throw new Error("Navigation contract stories require both change callbacks.");
    }

    await waitFor(() => expect(onRangeChange).toHaveBeenCalledWith(initialRange));
    await userEvent.click(within(canvasElement).getByRole("button", {
        name: buttonName
    }));
    await expect(onDateChange).toHaveBeenCalledOnce();
    await expect(onDateChange).toHaveBeenLastCalledWith(nextDate);
    await waitFor(() => expect(onRangeChange).toHaveBeenLastCalledWith(nextRange));
};

const meta = {
    title: "Scenarios/Navigation",
    component: StoryCalendar,
    args: {
        events: [],
        defaultDate: ANCHOR_DATE,
        onDateChange: fn(),
        onRangeChange: fn()
    },
    argTypes: {
        events: { control: false },
        defaultDate: { control: false },
        date: { control: false },
        viewProps: { control: false },
        onDateChange: { control: false },
        onRangeChange: { control: false }
    },
    parameters: {
        calendar: { timeZone: TIME_ZONE },
        docs: {
            description: {
                component: "Executable contracts for controlled and uncontrolled navigation, visible-range callbacks, and inclusive boundaries across every built-in view."
            }
        }
    }
} satisfies Meta<typeof StoryCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UncontrolledDay: Story = {
    args: {
        view: "day",
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME
        }
    },
    play: async ({ args, canvasElement }) => {
        await expectNavigation({
            args,
            buttonName: "Next day",
            canvasElement,
            initialRange: calendarRange(calendarDate(8, 14), calendarDate(8, 14)),
            nextDate: calendarDate(8, 15),
            nextRange: calendarRange(calendarDate(8, 15), calendarDate(8, 15))
        });
    }
};

export const ControlledWeek: Story = {
    args: {
        view: "week",
        date: ANCHOR_DATE,
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME
        }
    },
    render: (args) => <ControlledNavigation {...args} />,
    play: async ({ args, canvasElement }) => {
        await expectNavigation({
            args,
            buttonName: "Next week",
            canvasElement,
            initialRange: calendarRange(calendarDate(8, 13), calendarDate(8, 19)),
            nextDate: calendarDate(8, 21),
            nextRange: calendarRange(calendarDate(8, 20), calendarDate(8, 26))
        });
        await expect(
            within(canvasElement).getByText("Controlled anchor: 2026-09-21")
        ).toBeInTheDocument();
    }
};

export const UncontrolledAgenda: Story = {
    args: {
        view: "agenda",
        viewProps: { range: 3 }
    },
    play: async ({ args, canvasElement }) => {
        await expectNavigation({
            args,
            buttonName: "Next agenda range",
            canvasElement,
            initialRange: calendarRange(calendarDate(8, 14), calendarDate(8, 16)),
            nextDate: calendarDate(8, 17),
            nextRange: calendarRange(calendarDate(8, 17), calendarDate(8, 19))
        });
    }
};

export const UncontrolledMonth: Story = {
    args: { view: "month" },
    play: async ({ args, canvasElement }) => {
        await expectNavigation({
            args,
            buttonName: "Next month",
            canvasElement,
            initialRange: calendarRange(
                calendarDate(7, 30),
                calendarDate(9, 3),
                {
                    monthStart: calendarDate(8, 1),
                    monthEnd: calendarDate(8, 30)
                }
            ),
            nextDate: calendarDate(9, 14),
            nextRange: calendarRange(
                calendarDate(8, 27),
                calendarDate(9, 31),
                {
                    monthStart: calendarDate(9, 1),
                    monthEnd: calendarDate(9, 31)
                }
            )
        });
    }
};

export const UncontrolledTimeGrid: Story = {
    args: {
        view: "time-grid",
        viewProps: {
            range: 2,
            minTime: MIN_TIME,
            maxTime: MAX_TIME
        }
    },
    play: async ({ args, canvasElement }) => {
        await expectNavigation({
            args,
            buttonName: "Next range",
            canvasElement,
            initialRange: calendarRange(calendarDate(8, 14), calendarDate(8, 15)),
            nextDate: calendarDate(8, 16),
            nextRange: calendarRange(calendarDate(8, 16), calendarDate(8, 17))
        });
    }
};

export const BoundedWeek: Story = {
    args: {
        view: "week",
        date: "2026-09-17",
        minDate: "2026-09-16",
        maxDate: "2026-09-18",
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME
        }
    },
    play: async ({ args, canvasElement }) => {
        if (!args.onDateChange || !args.onRangeChange) {
            throw new Error("The bounded navigation story requires change callbacks.");
        }
        const previous = canvasElement.querySelector<HTMLButtonElement>(
            'button[aria-label="Previous week"]'
        );
        const next = canvasElement.querySelector<HTMLButtonElement>(
            'button[aria-label="Next week"]'
        );
        if (!previous || !next) {
            throw new Error("The bounded week must render both navigation controls.");
        }

        await waitFor(() => expect(args.onRangeChange).toHaveBeenCalledWith(
            calendarRange(calendarDate(8, 13), calendarDate(8, 19))
        ));
        await expect(previous).toBeDisabled();
        await expect(next).toBeDisabled();
        await expect(args.onDateChange).not.toHaveBeenCalled();
    }
};

export const ControlledBeforeMinimum: Story = {
    args: {
        view: "week",
        date: "2026-08-03",
        minDate: "2026-09-14",
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME,
            range: {
                dayCount: 7,
                navigation: {
                    resolveAnchor: () => asCalendarDate("2026-01-01", TIME_ZONE)
                }
            }
        }
    },
    render: (args) => <ControlledNavigation {...args} />,
    play: async ({ args, canvasElement }) => {
        await expectNavigation({
            args,
            buttonName: "Next week",
            canvasElement,
            initialRange: calendarRange(calendarDate(7, 3), calendarDate(7, 9)),
            nextDate: calendarDate(8, 14),
            nextRange: calendarRange(calendarDate(8, 14), calendarDate(8, 20))
        });
        await expect(
            within(canvasElement).getByText("Controlled anchor: 2026-09-14")
        ).toBeInTheDocument();
    }
};

export const ControlledAfterMaximum: Story = {
    args: {
        view: "week",
        date: "2026-10-05",
        maxDate: "2026-09-20",
        viewProps: {
            minTime: MIN_TIME,
            maxTime: MAX_TIME
        }
    },
    render: (args) => <ControlledNavigation {...args} />,
    play: async ({ args, canvasElement }) => {
        await expectNavigation({
            args,
            buttonName: "Previous week",
            canvasElement,
            initialRange: calendarRange(calendarDate(9, 4), calendarDate(9, 10)),
            nextDate: calendarDate(8, 20),
            nextRange: calendarRange(calendarDate(8, 20), calendarDate(8, 26))
        });
        await expect(
            within(canvasElement).getByText("Controlled anchor: 2026-09-20")
        ).toBeInTheDocument();
    }
};
