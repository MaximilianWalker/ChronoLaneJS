import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEventCollection } from "../../../src/core/events.js";
import type { NormalizedCalendarEvent } from "../../../src/types.js";
import {
    createLayout,
    resolveMaxEvents
} from "../../../src/views/month/layout.js";

const day = (offset: number, hour = 0) => new Date(2026, 8, 6 + offset, hour);
const event = (
    id: string,
    start: Date,
    end: Date
): NormalizedCalendarEvent => ({ id, start, end });

test("prepares keyed weeks and day occurrence state", () => {
    const layout = createLayout({
        anchorDate: day(8),
        weekStartsOn: 0,
        events: normalizeEventCollection([
            event("multi", day(5, 9), day(7, 10)),
            event("early", day(5, 8), day(5, 9))
        ]),
        backgroundEvents: normalizeEventCollection([
            event("background", day(6), day(8))
        ]),
        selectedDate: day(5),
        showOutsideDays: false,
        maxEventsPerDay: 1,
        overflowEnabled: true
    });
    const entries = layout.weeks.flatMap(({ days }) => days);
    const selectedDay = entries.find((entry) => entry.day.getTime() === day(5).getTime());
    const backgroundDay = entries.find((entry) => entry.day.getTime() === day(6).getTime());
    const continuingDay = entries.find((entry) => entry.day.getTime() === day(7).getTime());
    const outsideDay = entries[0];

    assert.equal(layout.weekdayHeaders.length, 7);
    assert.ok(layout.weeks.every((week) => week.key === week.days[0]?.key));
    assert.deepEqual(selectedDay?.visibleEvents.map((item) => item.event.id), ["early"]);
    assert.deepEqual(selectedDay?.callbackEvents.map(({ id }) => id), ["early", "multi"]);
    assert.equal(selectedDay?.hiddenEventCount, 1);
    assert.equal(selectedDay?.selected, true);
    assert.equal(selectedDay?.className, "month-view_day is-selected");
    assert.deepEqual(backgroundDay?.backgroundEvents.map((item) => item.event.id), ["background"]);
    assert.deepEqual(continuingDay?.visibleEvents.map((item) => item.event.id), ["multi"]);
    assert.equal(outsideDay?.outsideMonth, true);
    assert.equal(outsideDay?.showEvents, false);
});

test("keeps every event visible when overflow is disabled", () => {
    const layout = createLayout({
        anchorDate: day(8),
        weekStartsOn: 0,
        events: normalizeEventCollection([
            event("first", day(5, 8), day(5, 9)),
            event("second", day(5, 9), day(5, 10))
        ]),
        backgroundEvents: normalizeEventCollection<NormalizedCalendarEvent>([]),
        selectedDate: null,
        showOutsideDays: true,
        maxEventsPerDay: 0,
        overflowEnabled: false
    });
    const entry = layout.weeks
        .flatMap(({ days }) => days)
        .find(({ day: entryDay }) => entryDay.getTime() === day(5).getTime());

    assert.deepEqual(entry?.visibleEvents.map((item) => item.event.id), ["first", "second"]);
    assert.equal(entry?.hiddenEventCount, 0);
});

test("validates the month event row limit", () => {
    assert.equal(resolveMaxEvents(0), 0);
    assert.equal(resolveMaxEvents(4), 4);
    assert.throws(() => resolveMaxEvents(-1), /non-negative integer/);
    assert.throws(() => resolveMaxEvents(1.5), /non-negative integer/);
    assert.throws(() => resolveMaxEvents(Number.NaN), /non-negative integer/);
});
