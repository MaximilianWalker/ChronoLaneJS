import type { Meta, StoryObj } from "@storybook/react-vite";

import {
    FullyCustomizedAgenda,
    FullyCustomizedMonth,
    FullyCustomizedWeek
} from "../harnesses.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    backgroundEvents,
    basicEvents,
    monthEvents,
    resourceConfig,
    resourceEvents
} from "../fixtures.js";

const meta = {
    title: "Customization/Renderers",
    component: FullyCustomizedWeek,
    args: {
        date: ANCHOR_DATE,
        events: basicEvents,
        backgroundEvents,
        minTime: MIN_TIME,
        maxTime: MAX_TIME
    },
    argTypes: {
        events: { control: false },
        backgroundEvents: { control: false }
    }
} satisfies Meta<typeof FullyCustomizedWeek>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TimeGridRenderers: Story = {};

export const ResourceHeaders: Story = {
    args: {
        events: resourceEvents,
        resources: resourceConfig
    }
};

export const AgendaRenderers: Story = {
    render: ({ date, events }) => (
        <FullyCustomizedAgenda date={date} events={events} />
    ),
    parameters: {
        calendar: {
            width: "content"
        }
    }
};

export const AgendaEmptyState: Story = {
    args: {
        events: []
    },
    render: ({ date, events }) => (
        <FullyCustomizedAgenda date={date} events={events} />
    ),
    parameters: {
        calendar: {
            width: "content"
        }
    }
};

export const MonthRenderers: Story = {
    args: {
        events: monthEvents
    },
    render: ({ date, events }) => (
        <FullyCustomizedMonth date={date} events={events} />
    )
};
