import assert from "node:assert/strict";
import test from "node:test";

import { format } from "date-fns";

import { createEventDrop } from "../../../src/views/time-grid/drop.js";
import { createLayout } from "../../../src/views/time-grid/layout/createLayout.js";
import type { CalendarEvent } from "../../../src/types.js";

interface TestEvent extends CalendarEvent {
    id: string;
    start: Date;
    end: Date;
    resourceId?: string;
}

interface TestResource {
    id: string;
    name: string;
}

const date = (day: number, hour = 0, minute = 0): Date => (
    new Date(2026, 8, day, hour, minute)
);

test("describes a drop across days and resources", () => {
    const roomA = { id: "room-a", name: "Room A" };
    const roomB = { id: "room-b", name: "Room B" };
    const event: TestEvent = {
        id: "planning",
        title: "Planning",
        start: date(1, 9),
        end: date(1, 10, 30),
        resourceId: roomA.id
    };
    const layout = createLayout<TestEvent, TestResource>({
        days: [date(1), date(2)],
        events: [event],
        backgroundEvents: [],
        resources: { items: [roomA, roomB] },
        minTime: "08:00",
        maxTime: "18:00",
        slotDuration: 30,
        labelInterval: 60
    });
    const segment = layout.events.find(({ resource }) => resource === roomA);
    const slot = layout.slots.find(({ dayIndex, resource, start }) => (
        dayIndex === 1 && resource === roomB && start.getHours() === 10
    ));
    assert.ok(segment);
    assert.ok(slot);

    const drop = createEventDrop(segment, slot);

    assert.strictEqual(drop.event, event);
    assert.equal(format(drop.start, "yyyy-MM-dd HH:mm"), "2026-09-02 10:00");
    assert.equal(format(drop.end, "yyyy-MM-dd HH:mm"), "2026-09-02 11:30");
    assert.strictEqual(drop.source.resource, roomA);
    assert.strictEqual(drop.destination.resource, roomB);
    assert.equal(drop.source.resourceId, "room-a");
    assert.equal(drop.destination.resourceId, "room-b");
    assert.equal(format(drop.source.day, "yyyy-MM-dd"), "2026-09-01");
    assert.equal(format(drop.destination.day, "yyyy-MM-dd"), "2026-09-02");
});

test("uses the source event duration when dragging a clipped segment", () => {
    const event: TestEvent = {
        id: "overnight",
        title: "Overnight",
        start: date(1, 17, 30),
        end: date(2, 9, 15)
    };
    const layout = createLayout<TestEvent, unknown>({
        days: [date(1), date(4)],
        events: [event],
        backgroundEvents: [],
        minTime: "08:00",
        maxTime: "18:00",
        slotDuration: 60,
        labelInterval: 60
    });
    const segment = layout.events.find(({ dayIndex }) => dayIndex === 0);
    const slot = layout.slots.find(({ dayIndex, start }) => (
        dayIndex === 1 && start.getHours() === 10
    ));
    assert.ok(segment);
    assert.ok(slot);

    const drop = createEventDrop(segment, slot);

    assert.strictEqual(drop.event, event);
    assert.equal(format(segment.end, "yyyy-MM-dd HH:mm"), "2026-09-01 18:00");
    assert.equal(format(drop.start, "yyyy-MM-dd HH:mm"), "2026-09-04 10:00");
    assert.equal(format(drop.end, "yyyy-MM-dd HH:mm"), "2026-09-05 01:45");
});
