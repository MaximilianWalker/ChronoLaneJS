import assert from "node:assert/strict";
import test from "node:test";

import type { NormalizedCalendarEvent } from "../../../src/types.js";
import {
    createEventResize,
    createResizeBoundaries,
    createResizeIntervals,
    findAdjacentResizeBoundary,
    findClosestResizeBoundary,
    resolveResizeStep
} from "../../../src/views/time-grid/resize.js";
import { createEventPreviewSegments } from "../../../src/views/time-grid/preview.js";
import type { LayoutColumn } from "../../../src/views/time-grid/layout/types.js";

const at = (hour: number, minute = 0) => new Date(2026, 8, 14, hour, minute);
const day = at(0);
const columns: LayoutColumn<string>[] = [{
    key: "studio",
    day,
    resource: "Studio",
    resourceId: "studio",
    dayIndex: 0,
    resourceIndex: 0
}];
const timeWindow = {
    startMinute: 9 * 60,
    endMinute: (10 * 60) + 15,
    totalMinutes: 75
};
const intervals = createResizeIntervals({
    columns,
    timeWindow,
    resizeStep: 30
});
const event: NormalizedCalendarEvent = {
    id: "planning",
    start: at(9, 10),
    end: at(10)
};

test("resize boundaries leave at least one complete resize interval", () => {
    const startBoundaries = createResizeBoundaries({
        event,
        edge: "start",
        resourceId: "studio",
        intervals
    });
    const endBoundaries = createResizeBoundaries({
        event,
        edge: "end",
        resourceId: "studio",
        intervals
    });

    assert.deepEqual(startBoundaries.map(({ date }) => date), [at(9), at(9, 30)]);
    assert.deepEqual(endBoundaries.map(({ date }) => date), [at(10), at(10, 15)]);
});

test("a partial final resize interval remains valid", () => {
    const partialEvent: NormalizedCalendarEvent = {
        id: "partial",
        start: at(10),
        end: at(10, 5)
    };
    const boundaries = createResizeBoundaries({
        event: partialEvent,
        edge: "end",
        resourceId: "studio",
        intervals
    });

    assert.deepEqual(boundaries.map(({ date }) => date), [at(10, 15)]);
});

test("pointer and keyboard resolution use configured resize boundaries", () => {
    const boundaries = createResizeBoundaries({
        event,
        edge: "start",
        resourceId: "studio",
        intervals
    });

    assert.equal(findClosestResizeBoundary(boundaries, 0, 28, "start")?.date.getTime(), at(9, 30).getTime());
    assert.equal(findAdjacentResizeBoundary(boundaries, at(9, 30), -1)?.date.getTime(), at(9).getTime());
    assert.equal(findAdjacentResizeBoundary(boundaries, at(9, 30), 1), undefined);
});

test("resize results preserve source identity and the opposite boundary", () => {
    const [boundary] = createResizeBoundaries({
        event,
        edge: "start",
        resourceId: "studio",
        intervals
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
    const nextDayColumn: LayoutColumn<string> = {
        ...columns[0]!,
        key: "next-studio",
        day: nextDay,
        dayIndex: 1,
        resourceIndex: 0
    };
    const otherResourceColumn: LayoutColumn<string> = {
        ...nextDayColumn,
        key: "next-workshop",
        resource: "Workshop",
        resourceId: "workshop",
        resourceIndex: 1
    };
    const multiDayEvent: NormalizedCalendarEvent = {
        id: "conference",
        start: at(9),
        end: new Date(2026, 8, 15, 9, 10)
    };

    const boundaries = createResizeBoundaries({
        event: multiDayEvent,
        edge: "end",
        resourceId: "studio",
        intervals: createResizeIntervals({
            columns: [...columns, nextDayColumn, otherResourceColumn],
            timeWindow,
            resizeStep: 30
        })
    });

    assert.equal(
        boundaries.at(-1)?.date.getTime(),
        new Date(2026, 8, 15, 10, 15).getTime()
    );
    assert.ok(boundaries.every(({ resourceId }) => resourceId === "studio"));
});

test("resize precision is independent of visual slot duration", () => {
    const fineIntervals = createResizeIntervals({
        columns,
        timeWindow,
        resizeStep: 10
    });
    const boundaries = createResizeBoundaries({
        event,
        edge: "start",
        resourceId: "studio",
        intervals: fineIntervals
    });

    assert.deepEqual(
        boundaries.map(({ date }) => date),
        [at(9), at(9, 10), at(9, 20), at(9, 30), at(9, 40), at(9, 50)]
    );
});

test("resize previews project the complete proposal into visible columns", () => {
    const nextDay = new Date(2026, 8, 15);
    const nextDayColumn: LayoutColumn<string> = {
        ...columns[0]!,
        key: "next-studio",
        day: nextDay,
        dayIndex: 1
    };
    const otherResourceColumn: LayoutColumn<string> = {
        ...nextDayColumn,
        key: "next-workshop",
        resource: "Workshop",
        resourceId: "workshop",
        resourceIndex: 1
    };

    assert.deepEqual(createEventPreviewSegments({
        start: at(10),
        end: new Date(2026, 8, 15, 9, 30),
        resourceId: "studio",
        columns: [...columns, nextDayColumn, otherResourceColumn],
        timeWindow
    }), [
        {
            columnIndex: 0,
            startRow: 61,
            endRow: 76
        },
        {
            columnIndex: 1,
            startRow: 1,
            endRow: 31
        }
    ]);
});

test("resize steps must be positive whole minutes", () => {
    assert.equal(resolveResizeStep(1), 1);
    assert.throws(() => resolveResizeStep(0), /positive integer/);
    assert.throws(() => resolveResizeStep(1.5), /positive integer/);
});
