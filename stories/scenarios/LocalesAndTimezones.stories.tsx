import type { Meta, StoryObj } from "@storybook/react-vite";

import { DayView } from "../../src/index.js";
import {
    DstTransition,
    LocaleComparison,
    TimeZoneComparison
} from "../harnesses.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents
} from "../fixtures.js";

const meta = {
    title: "Scenarios/Locales and Timezones",
    component: LocaleComparison,
    args: {
        locale: "en-US",
        timeZone: "Europe/Lisbon"
    },
    argTypes: {
        locale: { control: false },
        timeZone: { control: false }
    }
} satisfies Meta<typeof LocaleComparison>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LocaleMatrix: Story = {};

export const TimeZoneMatrix: Story = {
    render: (args) => <TimeZoneComparison {...args} />
};

export const PortugueseInLisbon: Story = {
    parameters: {
        calendar: {
            locale: "pt-PT",
            timeZone: "Europe/Lisbon"
        }
    },
    render: (args) => (
        <DayView
            date={ANCHOR_DATE}
            events={basicEvents}
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
            locale={args.locale}
            timeZone={args.timeZone}
        />
    )
};

export const JapaneseInTokyo: Story = {
    parameters: {
        calendar: {
            locale: "ja-JP",
            timeZone: "Asia/Tokyo"
        }
    },
    render: (args) => (
        <DayView
            date={ANCHOR_DATE}
            events={basicEvents}
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
            locale={args.locale}
            timeZone={args.timeZone}
        />
    )
};

export const DaylightSavingChange: Story = {
    parameters: {
        calendar: {
            locale: "en-GB",
            timeZone: "Europe/Lisbon"
        }
    },
    render: (args) => <DstTransition {...args} />
};
