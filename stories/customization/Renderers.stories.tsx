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
    resources,
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
        resources
    }
};

export const AgendaRenderers: Story = {
    render: (args) => <FullyCustomizedAgenda {...args} />,
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
    render: (args) => <FullyCustomizedAgenda {...args} />,
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
    render: (args) => <FullyCustomizedMonth {...args} />
};
