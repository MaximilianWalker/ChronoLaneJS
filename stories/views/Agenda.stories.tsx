import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { AgendaView } from "../../src/index.js";
import {
    ANCHOR_DATE,
    basicEvents,
    multiDayEvents
} from "../fixtures.js";

const meta = {
    title: "Views/Agenda",
    component: AgendaView,
    args: {
        date: ANCHOR_DATE,
        events: basicEvents,
        range: 14
    },
    argTypes: {
        events: { control: false },
        range: { control: false }
    },
    parameters: {
        calendar: {
            width: "content"
        }
    }
} satisfies Meta<typeof AgendaView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    play: async ({ canvasElement }) => {
        await expect(
            canvasElement.querySelector(
                ".agenda-view_list.calendar-scroll-region"
            )
        ).not.toBeNull();
    }
};

export const Empty: Story = {
    args: {
        events: []
    }
};

export const MultiDayGrouping: Story = {
    args: {
        events: multiDayEvents
    }
};

export const WorkWeek: Story = {
    args: {
        range: {
            start: new Date(2026, 8, 14),
            days: 7,
            includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5,
            navigationStep: 7
        }
    }
};

export const BoundedNavigation: Story = {
    args: {
        minDate: "2026-09-14",
        maxDate: "2026-09-20"
    },
    play: async ({ canvasElement }) => {
        await expect(
            canvasElement.querySelectorAll(
                ".calendar-view_navigation-button:disabled"
            )
        ).toHaveLength(2);
    }
};

export const SelectedEvent: Story = {
    args: {
        selectedEventIds: ["planning"]
    }
};
