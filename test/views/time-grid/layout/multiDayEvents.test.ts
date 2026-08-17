import assert from "node:assert/strict";
import test from "node:test";

import { TZDate } from "@date-fns/tz";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";

import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../../../src/types.js";
import { createLayout } from "../../../../src/views/time-grid/layout/createLayout.js";
import {
    createMultiDayEventDrop,
    createMultiDayEventLayout,
    createMultiDayEventPreview,
    createMultiDayEventResize,
    getMultiDayMoveTargetIndex,
    getMultiDayPointerColumnIndex,
    getMultiDayResizeOffset,
    isMultiDayEvent
} from "../../../../src/views/time-grid/layout/multiDayEvents.js";

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

const date = (day: number, hour = 0): Date => new Date(2026, 8, day, hour);
const days = eachDayOfInterval({ start: date(14), end: date(18) });

const createColumns = (
    resources?: TestResource[],
    groupBy: "day" | "resource" = "day"
) => createLayout<TestEvent, TestResource>({
    days,
    events: [],
    backgroundEvents: [],
    resources: resources ? { items: resources } : undefined,
    groupBy,
    minTime: "08:00",
    maxTime: "18:00",
    slotDuration: 60,
    labelInterval: 60
}).columns;

test("preserves the dedicated pointer grab offset while moving", () => {
    assert.equal(getMultiDayMoveTargetIndex(0, 2, 2, 7), 0);
    assert.equal(getMultiDayMoveTargetIndex(0, 2, 3, 7), 1);
    assert.equal(getMultiDayMoveTargetIndex(3, 5, 4, 7), 2);
    assert.equal(getMultiDayMoveTargetIndex(0, 2, 0, 7), 0);
    assert.equal(getMultiDayMoveTargetIndex(5, 6, 8, 7), 6);
    assert.equal(getMultiDayMoveTargetIndex(0, 0, 0, 0), undefined);
});

test("resolves dedicated pointer columns from the actual grid bounds", () => {
    assert.equal(getMultiDayPointerColumnIndex(250, 0, 700, 7), 2);
    assert.equal(getMultiDayPointerColumnIndex(-10, 0, 700, 7), 0);
    assert.equal(getMultiDayPointerColumnIndex(800, 0, 700, 7), 6);
    assert.equal(getMultiDayPointerColumnIndex(0, 0, 0, 7), undefined);
    assert.equal(getMultiDayPointerColumnIndex(0, 0, 700, 0), undefined);
});

test("classifies every positive interval that crosses local midnight", () => {
    assert.equal(isMultiDayEvent({ start: date(14, 9), end: date(14, 10) }), false);
    assert.equal(isMultiDayEvent({ start: date(14, 23), end: date(15, 2) }), true);
    assert.equal(isMultiDayEvent({ start: date(14), end: date(15) }), true);
});

test("creates one clipped span and respects an exclusive midnight end", () => {
    const event: TestEvent = {
        id: "conference",
        start: date(13, 14),
        end: date(17)
    };
    const layout = createMultiDayEventLayout({
        events: [event],
        columns: createColumns()
    });

    assert.equal(layout.laneCount, 1);
    assert.deepEqual(layout.events.map((segment) => ({
        columnIndex: segment.columnIndex,
        columnSpan: segment.columnSpan,
        start: segment.start,
        end: segment.end
    })), [{
        columnIndex: 0,
        columnSpan: 3,
        start: date(14),
        end: date(17)
    }]);
});

test("assigns separate lanes only when visible spans overlap", () => {
    const layout = createMultiDayEventLayout({
        events: [
            { id: "long", start: date(14), end: date(17) },
            { id: "overlap", start: date(15), end: date(18) },
            { id: "adjacent", start: date(17), end: date(19) }
        ],
        columns: createColumns()
    });

    assert.equal(layout.laneCount, 2);
    assert.deepEqual(
        layout.events.map(({ id, laneIndex }) => ({ id, laneIndex })),
        [
            { id: "long", laneIndex: 0 },
            { id: "overlap", laneIndex: 1 },
            { id: "adjacent", laneIndex: 0 }
        ]
    );
});

test("splits spans around unrelated resource columns", () => {
    const studio = { id: "studio", name: "Studio" };
    const workshop = { id: "workshop", name: "Workshop" };
    const event: TestEvent = {
        id: "residency",
        resourceId: studio.id,
        start: date(14),
        end: date(17)
    };
    const dayFirst = createMultiDayEventLayout({
        events: [event],
        columns: createColumns([studio, workshop]),
        resources: { items: [studio, workshop] }
    });
    const resourceFirst = createMultiDayEventLayout({
        events: [event],
        columns: createColumns([studio, workshop], "resource"),
        resources: { items: [studio, workshop] }
    });

    assert.deepEqual(
        dayFirst.events.map(({ columnIndex, columnSpan }) => ({
            columnIndex,
            columnSpan
        })),
        [
            { columnIndex: 0, columnSpan: 1 },
            { columnIndex: 2, columnSpan: 1 },
            { columnIndex: 4, columnSpan: 1 }
        ]
    );
    assert.deepEqual(
        resourceFirst.events.map(({ columnIndex, columnSpan }) => ({
            columnIndex,
            columnSpan
        })),
        [{ columnIndex: 0, columnSpan: 3 }]
    );
});

test("previews a proposal only in its destination resource", () => {
    const studio = { id: "studio", name: "Studio" };
    const workshop = { id: "workshop", name: "Workshop" };
    const event: TestEvent = {
        id: "residency",
        resourceId: studio.id,
        start: date(14),
        end: date(16)
    };
    const preview = createMultiDayEventPreview({
        event,
        start: date(15),
        end: date(17),
        resourceId: workshop.id,
        columns: createColumns([studio, workshop], "resource")
    });

    assert.deepEqual(
        preview.map(({ columnIndex, columnSpan, resourceId }) => ({
            columnIndex,
            columnSpan,
            resourceId
        })),
        [{ columnIndex: 6, columnSpan: 2, resourceId: "workshop" }]
    );
});

test("day movement and resizing preserve wall-clock fields across DST", () => {
    const event: NormalizedCalendarEvent<TestEvent> = {
        id: "dst-residency",
        start: new TZDate(2026, 9, 24, 10, 0, "Europe/Lisbon"),
        end: new TZDate(2026, 9, 26, 10, 0, "Europe/Lisbon")
    };
    const zonedDays = eachDayOfInterval({
        start: new TZDate(2026, 9, 24, 0, 0, "Europe/Lisbon"),
        end: new TZDate(2026, 9, 28, 0, 0, "Europe/Lisbon")
    });
    const columns = createLayout<TestEvent, unknown>({
        days: zonedDays,
        events: [],
        backgroundEvents: [],
        minTime: "08:00",
        maxTime: "18:00",
        slotDuration: 60,
        labelInterval: 60
    }).columns;
    const segment = createMultiDayEventLayout({ events: [event], columns }).events[0];
    const destination = columns[1];
    assert.ok(segment);
    assert.ok(destination);

    const drop = createMultiDayEventDrop(segment, destination);
    assert.equal(drop.start.getDate(), 25);
    assert.equal(drop.start.getHours(), 10);
    assert.equal(drop.end.getDate(), 27);
    assert.equal(drop.end.getHours(), 10);

    const source = {
        day: segment.day,
        resource: segment.resource,
        resourceId: segment.resourceId
    };
    const resize = createMultiDayEventResize({
        event,
        edge: "end",
        dayOffset: 1,
        source
    });
    assert.equal(resize.end.getDate(), 27);
    assert.equal(resize.end.getHours(), 10);
    assert.equal(getMultiDayResizeOffset(event, "end", zonedDays[3]!), 1);
});
