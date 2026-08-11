import assert from "node:assert/strict";
import test from "node:test";

import { format } from "date-fns";

import { moveTimeGridEvent } from "../../../src/views/time-grid/timeGridEventDrop.js";
import { createTimeGridLayout } from "../../../src/views/time-grid/timeGridLayout.js";
import type { CalendarEvent } from "../../../src/types.js";

const date = (day: number, hour = 0, minute = 0): Date => (
    new Date(2026, 8, day, hour, minute)
);

test("moving a clipped event preserves its original duration", () => {
    const [segment] = createTimeGridLayout({
        days: [date(1)],
        events: [{
            id: "overnight",
            title: "Overnight",
            start: date(1, 17, 30),
            end: date(2, 9, 15)
        }],
        backgroundEvents: [],
        minTime: date(1, 8),
        maxTime: date(1, 18),
        step: 60,
        dividerInterval: 60
    }).events;
    assert.ok(segment);
    const moved = moveTimeGridEvent<CalendarEvent, unknown>(segment, date(4, 10));

    assert.equal(format(moved.start, "yyyy-MM-dd HH:mm"), "2026-09-04 10:00");
    assert.equal(format(moved.end, "yyyy-MM-dd HH:mm"), "2026-09-05 01:45");
});
