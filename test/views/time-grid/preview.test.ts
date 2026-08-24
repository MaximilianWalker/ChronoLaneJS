import assert from "node:assert/strict";
import test from "node:test";

import { enUS } from "date-fns/locale/en-US";

import type { ViewText } from "../../../src/components/eventPresentation.js";
import {
    defaultCalendarFormatters,
    defaultCalendarMessages
} from "../../../src/core/localization.js";
import type {
    CalendarEvent,
    CalendarResourceConfig
} from "../../../src/types.js";
import type {
    MoveState,
    MultiDayMoveState
} from "../../../src/views/time-grid/interactions/types.js";
import { createLayout } from "../../../src/views/time-grid/layout/createLayout.js";
import { createMultiDayEventLayout } from "../../../src/views/time-grid/layout/multiDayEvents.js";
import {
    createMultiDayMovePreview,
    createTimedMovePreview
} from "../../../src/views/time-grid/preview.js";

interface Event extends CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
}

interface Resource {
    id: string;
    name: string;
}

const day = (offset: number, hour = 0): Date => new Date(2026, 8, 14 + offset, hour);
const resource = { id: "studio", name: "Studio" };
const resources: CalendarResourceConfig<Event, Resource> = {
    items: [resource],
    getTitle: ({ name }) => name
};
const text: ViewText = {
    formatters: {
        ...defaultCalendarFormatters,
        date: (date) => [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-"),
        time: (date) => date.toTimeString().slice(0, 5)
    },
    messages: {
        ...defaultCalendarMessages,
        eventMoveTarget: ({ title, date, time, resource: resourceLabel }) => (
            `${title}|${date}|${time}|${resourceLabel ?? ""}`
        )
    },
    context: {
        locale: enUS,
        view: "week"
    }
};

const timedEvent: Event = {
    id: "timed",
    title: "Timed",
    start: day(0, 9),
    end: day(0, 10),
    color: "tomato",
    resourceId: "studio"
};
const multiDayEvent: Event = {
    id: "multi",
    title: "Multi",
    start: day(0),
    end: day(2),
    color: "royalblue",
    resourceId: "studio"
};
const layout = createLayout<Event, Resource>({
    days: [day(0), day(1), day(2), day(3)],
    events: [timedEvent],
    backgroundEvents: [],
    resources,
    groupBy: "day",
    minTime: "08:00",
    maxTime: "18:00",
    slotDuration: 60,
    labelInterval: 60
});

test("prepares timed move preview presentation", () => {
    const segment = layout.events[0]!;
    const origin = layout.slots.find((slot) => (
        slot.columnIndex === 0 && slot.start.getHours() === 9
    ))!;
    const target = layout.slots.find((slot) => (
        slot.columnIndex === 1 && slot.start.getHours() === 10
    ))!;
    const move: MoveState<Event, Resource> = {
        kind: "move",
        segment,
        origin,
        target,
        handleKey: "timed-move"
    };
    const movePreview = createTimedMovePreview({
        move,
        columns: layout.columns,
        timeWindow: layout.timeWindow,
        resources,
        text
    });

    assert.equal(movePreview?.announcement, "Timed|2026-09-15|10:00|Studio");
    assert.deepEqual(movePreview?.segments, [{
        key: "1",
        style: {
            "--color": "tomato",
            gridColumn: 2,
            gridRow: "121 / 181"
        }
    }]);

});

test("prepares multi-day move preview presentation", () => {
    const multiDayLayout = createMultiDayEventLayout({
        events: [multiDayEvent],
        columns: layout.columns,
        resources
    });
    const segment = multiDayLayout.events[0]!;
    const move: MultiDayMoveState<Event, Resource> = {
        kind: "multi-day-move",
        segment,
        origin: layout.columns[0]!,
        target: layout.columns[1]!,
        handleKey: "multi-move"
    };
    const movePreview = createMultiDayMovePreview({
        move,
        columns: layout.columns,
        resources,
        text
    });

    assert.equal(movePreview?.announcement, "Multi|2026-09-15|00:00|Studio");
    assert.deepEqual(movePreview?.segments, [{
        key: "1-2",
        style: {
            "--color": "royalblue",
            gridColumn: "2 / span 2",
            gridRow: 1
        }
    }]);

});
