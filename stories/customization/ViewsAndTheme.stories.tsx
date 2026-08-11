import type { Meta, StoryObj } from "@storybook/react-vite";

import type { CalendarStyle } from "../../src/index.js";
import {
    CustomViewExample,
    StoryCalendar
} from "../harnesses.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents
} from "../fixtures.js";

const meta = {
    title: "Customization/Views and Theme",
    component: StoryCalendar,
    args: {
        date: ANCHOR_DATE,
        events: basicEvents,
        minTime: MIN_TIME,
        maxTime: MAX_TIME
    },
    argTypes: {
        events: { control: false },
        views: { control: false },
        style: { control: false }
    }
} satisfies Meta<typeof StoryCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegisteredView: Story = {
    render: (args) => <CustomViewExample {...args} />
};

export const CssTheme: Story = {
    args: {
        view: "week",
        className: "story-theme",
        style: {
            "--story-accent": "#0f766e"
        } as CalendarStyle
    }
};
