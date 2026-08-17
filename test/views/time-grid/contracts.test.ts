import assert from "node:assert/strict";
import test from "node:test";

import {
    toTimeGridColumn,
    toTimeGridEventSegment,
    toTimeGridSlot
} from "../../../src/views/time-grid/contracts.js";
import type { CalendarEvent } from "../../../src/types.js";

interface TestEvent extends CalendarEvent {
    id: string;
}

interface TestResource {
    id: string;
}

const day = new Date(2026, 8, 14);
const start = new Date(2026, 8, 14, 9);
const end = new Date(2026, 8, 14, 9, 30);
const resource = { id: "studio" };
const event: TestEvent & { start: Date; end: Date } = {
    id: "planning",
    title: "Planning",
    start,
    end
};

test("projects private columns to the semantic renderer contract", () => {
    const column = toTimeGridColumn({
        key: "generated-column-key",
        day,
        dayIndex: 0,
        resource,
        resourceId: resource.id,
        resourceIndex: 0
    });

    assert.deepEqual(Object.keys(column).sort(), ["day", "resource", "resourceId"]);
    assert.strictEqual(column.resource, resource);
});

test("projects private slots to the semantic renderer contract", () => {
    const slot = toTimeGridSlot({
        key: "generated-slot-key",
        start,
        end,
        duration: 30,
        timeIndex: 2,
        day,
        dayIndex: 0,
        columnIndex: 1,
        resource,
        resourceId: resource.id,
        isDividerBoundary: true
    });

    assert.deepEqual(Object.keys(slot).sort(), [
        "day",
        "duration",
        "end",
        "resource",
        "resourceId",
        "start"
    ]);
});

test("projects private event placement to the semantic renderer contract", () => {
    const layoutSegment = {
        ...event,
        event,
        day,
        dayIndex: 0,
        columnIndex: 1,
        resource,
        resourceId: resource.id,
        resourceIndex: 0,
        startRow: 61,
        endRow: 91
    };
    const segment = toTimeGridEventSegment<TestResource>(layoutSegment);

    assert.deepEqual(Object.keys(segment).sort(), [
        "day",
        "end",
        "layout",
        "resource",
        "resourceId",
        "start"
    ]);
    assert.equal(segment.layout, "timed");
});

test("identifies dedicated event segments for custom renderers", () => {
    const segment = toTimeGridEventSegment<TestResource>({
        start,
        end: new Date(2026, 8, 16, 9, 30),
        day,
        resource,
        resourceId: resource.id
    }, "dedicated");

    assert.equal(segment.layout, "dedicated");
    assert.equal(segment.day, day);
    assert.equal(segment.end.getDate(), 16);
});
