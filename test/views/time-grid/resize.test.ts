import assert from "node:assert/strict";
import test from "node:test";

import type { NormalizedCalendarEvent } from "../../../src/types.js";
import {
    createEventResize,
    createTimeGridResizeBoundaries,
    findAdjacentResizeBoundary,
    findClosestResizeBoundary
} from "../../../src/views/time-grid/resize.js";
import type { LayoutSlot } from "../../../src/views/time-grid/layout/types.js";

const at = (hour: number, minute = 0) => new Date(2026, 8, 14, hour, minute);
const day = at(0);
const slots: LayoutSlot<string>[] = [
    [at(9), at(9, 30), 0, 30],
    [at(9, 30), at(10), 1, 30],
    [at(10), at(10, 15), 2, 15]
].map(([start, end, timeIndex, duration]) => ({
    key: String(timeIndex),
    start: start as Date,
    end: end as Date,
    duration: duration as number,
    day,
    resource: "Studio",
    resourceId: "studio",
    timeIndex: timeIndex as number,
    dayIndex: 0,
    columnIndex: 0,
    isDividerBoundary: false
}));
const event: NormalizedCalendarEvent = {
    id: "planning",
    start: at(9, 10),
    end: at(10)
};

test("resize boundaries leave at least one complete visible slot", () => {
    const startBoundaries = createTimeGridResizeBoundaries({
        event,
        edge: "start",
        resourceId: "studio",
        slots,
        slotDuration: 30
    });
    const endBoundaries = createTimeGridResizeBoundaries({
        event,
        edge: "end",
        resourceId: "studio",
        slots,
        slotDuration: 30
    });

    assert.deepEqual(startBoundaries.map(({ date }) => date), [at(9), at(9, 30)]);
    assert.deepEqual(endBoundaries.map(({ date }) => date), [at(10), at(10, 15)]);
});

test("a partial final grid slot remains a valid minimum interval", () => {
    const partialEvent: NormalizedCalendarEvent = {
        id: "partial",
        start: at(10),
        end: at(10, 5)
    };
    const boundaries = createTimeGridResizeBoundaries({
        event: partialEvent,
        edge: "end",
        resourceId: "studio",
        slots,
        slotDuration: 30
    });

    assert.deepEqual(boundaries.map(({ date }) => date), [at(10, 15)]);
});

test("pointer and keyboard resolution use existing slot boundaries", () => {
    const boundaries = createTimeGridResizeBoundaries({
        event,
        edge: "start",
        resourceId: "studio",
        slots,
        slotDuration: 30
    });

    assert.equal(findClosestResizeBoundary(boundaries, 0, 28, "start")?.date.getTime(), at(9, 30).getTime());
    assert.equal(findAdjacentResizeBoundary(boundaries, at(9, 30), -1)?.date.getTime(), at(9).getTime());
    assert.equal(findAdjacentResizeBoundary(boundaries, at(9, 30), 1), undefined);
});

test("resize results preserve source identity and the opposite boundary", () => {
    const [boundary] = createTimeGridResizeBoundaries({
        event,
        edge: "start",
        resourceId: "studio",
        slots,
        slotDuration: 30
    });
    assert.ok(boundary);

    const result = createEventResize(event, "start", boundary, {
        day,
        resource: "Studio",
        resourceId: "studio"
    });

    assert.strictEqual(result.event, event);
    assert.equal(result.start.getTime(), at(9).getTime());
    assert.strictEqual(result.end, event.end);
    assert.equal(result.edge, "start");
    assert.equal(result.source.resourceId, "studio");
});

test("resize boundaries may cross visible days but never resources", () => {
    const nextDay = new Date(2026, 8, 15);
    const nextDaySlot: LayoutSlot<string> = {
        ...slots[0]!,
        key: "next-studio",
        start: new Date(2026, 8, 15, 9),
        end: new Date(2026, 8, 15, 9, 30),
        day: nextDay,
        dayIndex: 1,
        columnIndex: 1
    };
    const otherResourceSlot: LayoutSlot<string> = {
        ...nextDaySlot,
        key: "next-workshop",
        resource: "Workshop",
        resourceId: "workshop",
        columnIndex: 2
    };
    const multiDayEvent: NormalizedCalendarEvent = {
        id: "conference",
        start: at(9),
        end: new Date(2026, 8, 15, 9, 10)
    };

    const boundaries = createTimeGridResizeBoundaries({
        event: multiDayEvent,
        edge: "end",
        resourceId: "studio",
        slots: [...slots, nextDaySlot, otherResourceSlot],
        slotDuration: 30
    });

    assert.equal(boundaries.at(-1)?.date.getTime(), nextDaySlot.end.getTime());
    assert.ok(boundaries.every(({ resourceId }) => resourceId === "studio"));
});
