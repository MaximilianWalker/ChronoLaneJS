import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";

import {
    AgendaView,
    DayView,
    MonthView,
    defaultCalendarMessages
} from "../../src/index.js";
import type { CalendarMessages } from "../../src/index.js";
import {
    DstTransition,
    LocaleComparison,
    TimeZoneComparison
} from "../harnesses.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    MONTH_DATE,
    basicEvents,
    monthEvents
} from "../fixtures.js";

const portugueseMessages: CalendarMessages = {
    ...defaultCalendarMessages,
    previous: () => "Dia anterior",
    next: () => "Dia seguinte",
    timeGridLabel: () => "Grelha do calendário",
    monthGridLabel: () => "Grelha mensal do calendário",
    slotLabel: ({ date, time }) => `Horário do calendário, ${date}, ${time}`,
    eventLabel: ({
        title,
        description,
        startDate,
        startTime,
        endDate,
        endTime
    }) => [
        title ?? "Evento do calendário",
        `De ${startDate}, ${startTime} a ${endDate}, ${endTime}`,
        description
    ].filter(Boolean).join(", "),
    agendaEmpty: () => "Não existem eventos neste período.",
    moreEvents: ({ count }) => `+${count} eventos`
};

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

export const PortugueseMessages: Story = {
    render: () => (
        <DayView
            date={ANCHOR_DATE}
            events={basicEvents}
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
            locale="pt-PT"
            timeZone="Europe/Lisbon"
            messages={portugueseMessages}
            onEventSelect={fn()}
            onSlotSelect={fn()}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.findByLabelText("Grelha do calendário")).resolves.toBeTruthy();
        await expect(canvas.findByRole("button", { name: "Dia anterior" })).resolves.toBeTruthy();
        await expect(canvas.findByRole("button", {
            name: /Horário do calendário.*08:00/
        })).resolves.toBeTruthy();
        await expect(canvas.findByRole("button", {
            name: /Planning, De .*09:00.*10:15/
        })).resolves.toBeTruthy();
        await expect(canvas.findByText("08:00")).resolves.toBeTruthy();
    }
};

export const PortugueseEmptyAndOverflowText: Story = {
    render: () => (
        <div className="story-grid">
            <section className="story-panel">
                <AgendaView
                    date={ANCHOR_DATE}
                    events={[]}
                    range={7}
                    locale="pt-PT"
                    messages={portugueseMessages}
                />
            </section>
            <section className="story-panel">
                <MonthView
                    date={MONTH_DATE}
                    events={monthEvents}
                    maxEventsPerDay={0}
                    locale="pt-PT"
                    messages={portugueseMessages}
                />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.findByText("Não existem eventos neste período.")).resolves.toBeTruthy();
        await expect(canvas.findAllByRole("button", {
            name: /\+\d+ eventos/
        })).resolves.not.toHaveLength(0);
    }
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
