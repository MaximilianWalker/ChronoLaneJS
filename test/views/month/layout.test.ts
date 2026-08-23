import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEventCollection } from "../../../src/core/events.js";
import type { NormalizedCalendarEvent } from "../../../src/types.js";
import {
    createWeeks,
    resolveMaxEvents
} from "../../../src/views/month/layout.js";

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
        events: normalizeEventCollection([
            event("multi", day(5, 9), day(7, 10)),
            event("early", day(5, 8), day(5, 9))
        ]),
        backgroundEvents: normalizeEventCollection([
            event("background", day(6), day(8))
        ])
    });

    assert.deepEqual(weeks.map((week) => week.length), [7, 3]);
    assert.deepEqual(
        weeks[0]?.[5]?.events.map((item) => item.event.id),
        ["early", "multi"]
    );
    assert.deepEqual(
        weeks[0]?.[6]?.backgroundEvents.map((item) => item.event.id),
        ["background"]
    );
    assert.deepEqual(
        weeks[1]?.[0]?.events.map((item) => item.event.id),
        ["multi"]
    );
});

test("validates the month event row limit", () => {
    assert.equal(resolveMaxEvents(0), 0);
    assert.equal(resolveMaxEvents(4), 4);
    assert.throws(() => resolveMaxEvents(-1), /non-negative integer/);
    assert.throws(() => resolveMaxEvents(1.5), /non-negative integer/);
    assert.throws(() => resolveMaxEvents(Number.NaN), /non-negative integer/);
});
