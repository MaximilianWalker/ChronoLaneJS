import assert from "node:assert/strict";
import test from "node:test";

import { TZDate } from "@date-fns/tz";
import { eachDayOfInterval, format } from "date-fns";

import { createTimeGridLayout } from "../../../src/views/time-grid/layout.js";

const date = (day, hour = 0, minute = 0) => new Date(2026, 8, day, hour, minute);

const createLayout = ({
    events = [],
    backgroundEvents = [],
    days = [date(1)],
    resources = [],
    minTime = date(1, 8),
    maxTime = date(1, 18),
    step = 60,
    dividerInterval = step,
    ...options
} = {}) => createTimeGridLayout({
    days,
    events,
    backgroundEvents,
    resources,
    minTime,
    maxTime,
    step,
    dividerInterval,
    ...options
});

test("creates one column per visible day and resource", () => {
    const resources = [
        { id: "room-a", name: "Room A" },
        { id: "room-b", name: "Room B" }
    ];
    const layout = createLayout({
        days: [date(1), date(2)],
        resources
    });

    assert.equal(layout.columns.length, 4);
    assert.deepEqual(
        layout.columns.map(({ dayIndex, resource }) => ({
            dayIndex,
            resourceId: resource.id
        })),
        [
            { dayIndex: 0, resourceId: "room-a" },
            { dayIndex: 0, resourceId: "room-b" },
            { dayIndex: 1, resourceId: "room-a" },
            { dayIndex: 1, resourceId: "room-b" }
        ]
    );
});

test("creates slots and dividers from one validated time scale", () => {
    const layout = createLayout({ step: 30, dividerInterval: 60 });

    assert.equal(layout.totalMinutes, 600);
    assert.equal(layout.slots.length, 20);
    assert.equal(layout.dividers.length, 10);
    assert.equal(format(layout.slots[0].start, "HH:mm"), "08:00");
    assert.equal(format(layout.slots.at(-1).end, "HH:mm"), "18:00");
    assert.equal(layout.slots[1].isDividerBoundary, true);
});

test("assigns lanes per local overlap cluster and reuses ended lanes", () => {
    const layout = createLayout({
        events: [
            { id: "two-a", title: "two-a", start: date(1, 9), end: date(1, 11) },
            { id: "two-b", title: "two-b", start: date(1, 10), end: date(1, 12) },
            { id: "three-a", title: "three-a", start: date(1, 13), end: date(1, 15) },
            { id: "three-b", title: "three-b", start: date(1, 13, 15), end: date(1, 14) },
            { id: "three-c", title: "three-c", start: date(1, 13, 30), end: date(1, 14, 30) },
            { id: "reuse", title: "reuse", start: date(1, 14), end: date(1, 16) }
        ]
    });

    assert.deepEqual(
        layout.events.filter(({ id }) => id.startsWith("two-")).map(({ laneCount }) => laneCount),
        [2, 2]
    );
    assert.deepEqual(
        layout.events.filter(({ id }) => id.startsWith("three-") || id === "reuse")
            .map(({ id, laneIndex, laneCount }) => ({ id, laneIndex, laneCount })),
        [
            { id: "three-a", laneIndex: 0, laneCount: 3 },
            { id: "three-b", laneIndex: 1, laneCount: 3 },
            { id: "three-c", laneIndex: 2, laneCount: 3 },
            { id: "reuse", laneIndex: 1, laneCount: 3 }
        ]
    );
});

test("adjacent events do not consume separate lanes", () => {
    const layout = createLayout({
        events: [
            { id: "first", title: "First", start: date(1, 9), end: date(1, 10) },
            { id: "second", title: "Second", start: date(1, 10), end: date(1, 11) }
        ]
    });

    assert.deepEqual(
        layout.events.map(({ laneIndex, laneCount }) => ({ laneIndex, laneCount })),
        [
            { laneIndex: 0, laneCount: 1 },
            { laneIndex: 0, laneCount: 1 }
        ]
    );
});

test("duplicates multi-resource events only into assigned columns", () => {
    const resources = [
        { id: "room-a", name: "Room A" },
        { id: "room-b", name: "Room B" }
    ];
    const layout = createLayout({
        resources,
        events: [
            {
                id: "both",
                title: "Both rooms",
                resourceIds: ["room-a", "room-b"],
                start: date(1, 9),
                end: date(1, 10)
            },
            {
                id: "room-a-only",
                title: "Room A only",
                resourceId: "room-a",
                start: date(1, 11),
                end: date(1, 12)
            }
        ]
    });

    assert.deepEqual(
        layout.events.map(({ id, columnIndex, resource }) => ({
            id,
            columnIndex,
            resourceId: resource.id
        })),
        [
            { id: "both", columnIndex: 0, resourceId: "room-a" },
            { id: "both", columnIndex: 1, resourceId: "room-b" },
            { id: "room-a-only", columnIndex: 0, resourceId: "room-a" }
        ]
    );
});

test("clips overnight events into each visible day", () => {
    const layout = createLayout({
        days: eachDayOfInterval({ start: date(1), end: date(2) }),
        events: [{
            id: "overnight",
            title: "Overnight",
            start: date(1, 17, 30),
            end: date(2, 9, 15)
        }]
    });

    assert.deepEqual(
        layout.events.map(({ dayIndex, startRow, endRow, start, end }) => ({
            dayIndex,
            startRow,
            endRow,
            start: format(start, "yyyy-MM-dd HH:mm"),
            end: format(end, "yyyy-MM-dd HH:mm")
        })),
        [
            {
                dayIndex: 0,
                startRow: 571,
                endRow: 601,
                start: "2026-09-01 17:30",
                end: "2026-09-01 18:00"
            },
            {
                dayIndex: 1,
                startRow: 1,
                endRow: 76,
                start: "2026-09-02 08:00",
                end: "2026-09-02 09:15"
            }
        ]
    );
});

test("does not create empty segments at visible boundaries", () => {
    const layout = createLayout({
        events: [
            {
                id: "ends-at-start",
                title: "Ends at start",
                start: date(0, 17),
                end: date(1, 8)
            },
            {
                id: "starts-at-end",
                title: "Starts at end",
                start: date(1, 18),
                end: date(1, 20)
            }
        ]
    });

    assert.deepEqual(layout.events, []);
});

test("uses wall-clock rows across Lisbon daylight-saving changes", () => {
    const timeZone = "Europe/Lisbon";
    const clockChangeDays = [
        new TZDate(2026, 2, 29, 0, 0, 0, 0, timeZone),
        new TZDate(2026, 9, 25, 0, 0, 0, 0, timeZone)
    ];

    const results = clockChangeDays.map((day) => {
        const nextDay = new TZDate(
            day.getFullYear(),
            day.getMonth(),
            day.getDate() + 1,
            0,
            0,
            0,
            0,
            timeZone
        );
        const maxTime = new TZDate(
            day.getFullYear(),
            day.getMonth(),
            day.getDate(),
            23,
            59,
            59,
            999,
            timeZone
        );
        const [segment] = createLayout({
            days: [day],
            minTime: day,
            maxTime,
            events: [{
                id: `full-day-${day.getMonth()}`,
                title: "Full day",
                start: day,
                end: nextDay
            }]
        }).events;

        return {
            date: format(segment.start, "yyyy-MM-dd"),
            end: format(segment.end, "yyyy-MM-dd HH:mm"),
            startRow: segment.startRow,
            endRow: segment.endRow
        };
    });

    assert.deepEqual(results, [
        { date: "2026-03-29", end: "2026-03-29 23:59", startRow: 1, endRow: 1440 },
        { date: "2026-10-25", end: "2026-10-25 23:59", startRow: 1, endRow: 1440 }
    ]);
});

test("rejects invalid time scales", () => {
    assert.throws(
        () => createLayout({ minTime: date(1, 18), maxTime: date(1, 8) }),
        /maxTime must be after minTime/
    );
    assert.throws(() => createLayout({ step: 0 }), /positive integer/);
});
