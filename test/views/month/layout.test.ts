import assert from "node:assert/strict";
import test from "node:test";

import type { NormalizedCalendarEvent } from "../../../src/types.js";
import { createWeeks } from "../../../src/views/month/layout.js";

const day = (offset: number, hour = 0) => new Date(2026, 8, 6 + offset, hour);
const event = (
    id: string,
    start: Date,
    end: Date
): NormalizedCalendarEvent => ({ id, start, end });

test("groups days into weeks and keeps occurrences with each day", () => {
    const days = Array.from({ length: 10 }, (_, index) => day(index));
    const weeks = createWeeks({
        days,
        events: [
            event("multi", day(5, 9), day(7, 10)),
            event("early", day(5, 8), day(5, 9))
        ],
        backgroundEvents: [event("background", day(6), day(8))]
    });

    assert.deepEqual(weeks.map((week) => week.length), [7, 3]);
    assert.deepEqual(
        weeks[0]?.[5]?.events.map((item) => item.id),
        ["early", "multi"]
    );
    assert.deepEqual(
        weeks[0]?.[6]?.backgroundEvents.map((item) => item.id),
        ["background"]
    );
    assert.deepEqual(
        weeks[1]?.[0]?.events.map((item) => item.id),
        ["multi"]
    );
});
