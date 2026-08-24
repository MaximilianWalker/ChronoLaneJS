import assert from "node:assert/strict";
import test from "node:test";

import type { NormalizedCalendarEvent } from "../../../src/types.js";
import { partitionEvents } from "../../../src/views/time-grid/eventModel.js";
import type { MultiDayEventLayout } from "../../../src/views/time-grid/types.js";

const date = (day: number, hour = 0): Date => (
    new Date(2026, 8, day, hour)
);

const events: NormalizedCalendarEvent[] = [
    {
        id: "timed",
        title: "Timed",
        start: date(14, 9),
        end: date(14, 10)
    },
    {
        id: "multi-day",
        title: "Multi-day",
        start: date(14, 9),
        end: date(15, 10)
    }
];

test("keeps every event in the timed layout", () => {
    const partition = partitionEvents(events, "timed");

    assert.equal(partition.timedEvents, events);
    assert.deepEqual(partition.dedicatedEvents, []);
});

test("partitions dedicated multi-day events", () => {
    const partition = partitionEvents(events, "dedicated");

    assert.deepEqual(partition.timedEvents.map(({ id }) => id), ["timed"]);
    assert.deepEqual(partition.dedicatedEvents.map(({ id }) => id), ["multi-day"]);
});

test("rejects unsupported multi-day layouts", () => {
    assert.throws(
        () => partitionEvents(events, "separate" as MultiDayEventLayout),
        /multiDayEventLayout must be either "timed" or "dedicated"/
    );
});
