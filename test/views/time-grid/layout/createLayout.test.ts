import assert from "node:assert/strict";
import test from "node:test";

import { TZDate } from "@date-fns/tz";
import {
    eachDayOfInterval,
    format
} from "date-fns";

import { createLayout as buildLayout } from "../../../../src/views/time-grid/layout/createLayout.js";
import { createPositionedEvents } from "../../../../src/views/time-grid/layout/events.js";
import { createHeaderRows } from "../../../../src/views/time-grid/layout/headers.js";
import type {
    CalendarEvent,
    CalendarResourceConfig,
    CalendarResourceId
} from "../../../../src/types.js";
import type {
    GroupBy,
    TimeOfDay
} from "../../../../src/views/time-grid/types.js";

interface TestEvent extends CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resourceId?: CalendarResourceId;
    resourceIds?: CalendarResourceId[];
}

interface TestResource {
    id?: CalendarResourceId;
    name: string;
}

interface CreateLayoutOptions {
    events?: TestEvent[];
    backgroundEvents?: TestEvent[];
    days?: Date[];
    resources?: CalendarResourceConfig<TestEvent, TestResource>;
    groupBy?: GroupBy;
    minTime?: TimeOfDay;
    maxTime?: TimeOfDay | "24:00";
    slotDuration?: number;
    labelInterval?: number;
}

const date = (day: number, hour = 0, minute = 0): Date => (
    new Date(2026, 8, day, hour, minute)
);

const createLayout = ({
    events = [],
    backgroundEvents = [],
    days = [date(1)],
    resources,
    minTime = "08:00",
    maxTime = "18:00",
    slotDuration = 60,
    labelInterval = slotDuration,
    ...options
}: CreateLayoutOptions = {}) => buildLayout<TestEvent, TestResource>({
    days,
    events,
    backgroundEvents,
    resources,
    minTime,
    maxTime,
    slotDuration,
    labelInterval,
    ...options
});

test("creates one column per visible day and resource", () => {
    const resources = [
        { id: "room-a", name: "Room A" },
        { id: "room-b", name: "Room B" }
    ];
    const layout = createLayout({
        days: [date(1), date(2)],
        resources: { items: resources }
    });

    assert.equal(layout.columns.length, 4);
    assert.deepEqual(
        layout.columns.map(({ dayIndex, resource }) => ({
            dayIndex,
            resourceId: resource?.id
        })),
        [
            { dayIndex: 0, resourceId: "room-a" },
            { dayIndex: 0, resourceId: "room-b" },
            { dayIndex: 1, resourceId: "room-a" },
            { dayIndex: 1, resourceId: "room-b" }
        ]
    );
});

test("orders resource groups before their visible days when requested", () => {
    const layout = createLayout({
        days: [date(1), date(2)],
        resources: {
            items: [
                { id: "room-a", name: "Room A" },
                { id: "room-b", name: "Room B" }
            ]
        },
        groupBy: "resource",
        events: [{
            id: "room-b-day-two",
            title: "Room B on day two",
            resourceId: "room-b",
            start: date(2, 9),
            end: date(2, 10)
        }]
    });

    assert.deepEqual(
        layout.columns.map(({ dayIndex, resourceId, resourceIndex }) => ({
            dayIndex,
            resourceId,
            resourceIndex
        })),
        [
            { dayIndex: 0, resourceId: "room-a", resourceIndex: 0 },
            { dayIndex: 1, resourceId: "room-a", resourceIndex: 0 },
            { dayIndex: 0, resourceId: "room-b", resourceIndex: 1 },
            { dayIndex: 1, resourceId: "room-b", resourceIndex: 1 }
        ]
    );
    assert.equal(layout.events[0]?.columnIndex, 3);
    assert.equal(layout.slots.find(
        ({ columnIndex }) => columnIndex === 3
    )?.resourceId, "room-b");
});

test("builds aligned day-first and resource-first header rows", () => {
    const dayFirst = createLayout({
        days: [date(1), date(2)],
        resources: {
            items: [
                { id: "room-a", name: "Room A" },
                { id: "room-b", name: "Room B" }
            ]
        }
    });
    const dayHeaders = createHeaderRows(dayFirst.columns, "day");

    assert.deepEqual(
        dayHeaders.primary.map(({ kind, columnIndex, columns }) => ({
            kind,
            columnIndex,
            columnSpan: columns.length
        })),
        [
            { kind: "day", columnIndex: 0, columnSpan: 2 },
            { kind: "day", columnIndex: 2, columnSpan: 2 }
        ]
    );
    assert.deepEqual(
        dayHeaders.secondary.map(({ kind, columnIndex, columns }) => ({
            kind,
            columnIndex,
            columnSpan: columns.length
        })),
        [
            { kind: "resource", columnIndex: 0, columnSpan: 1 },
            { kind: "resource", columnIndex: 1, columnSpan: 1 },
            { kind: "resource", columnIndex: 2, columnSpan: 1 },
            { kind: "resource", columnIndex: 3, columnSpan: 1 }
        ]
    );

    const resourceFirst = createLayout({
        days: [date(1), date(2)],
        resources: {
            items: [
                { id: "room-a", name: "Room A" },
                { id: "room-b", name: "Room B" }
            ]
        },
        groupBy: "resource"
    });
    const resourceHeaders = createHeaderRows(
        resourceFirst.columns,
        "resource"
    );

    assert.deepEqual(
        resourceHeaders.primary.map(({ kind, columnIndex, columns }) => ({
            kind,
            columnIndex,
            columnSpan: columns.length
        })),
        [
            { kind: "resource", columnIndex: 0, columnSpan: 2 },
            { kind: "resource", columnIndex: 2, columnSpan: 2 }
        ]
    );
    assert.equal(resourceHeaders.secondary.length, 4);
    assert.ok(resourceHeaders.secondary.every(({ kind }) => kind === "day"));
});

test("omits resource headers when resources are not configured", () => {
    const layout = createLayout({ days: [date(1), date(2)] });
    const headers = createHeaderRows(layout.columns, "resource");

    assert.equal(headers.primary.length, 2);
    assert.ok(headers.primary.every(({ kind }) => kind === "day"));
    assert.deepEqual(headers.secondary, []);
});

test("creates slots and dividers from one validated time scale", () => {
    const layout = createLayout({ slotDuration: 30, labelInterval: 60 });

    assert.equal(layout.totalMinutes, 600);
    assert.equal(layout.slots.length, 20);
    assert.equal(layout.slotRows.length, 20);
    assert.ok(layout.slotRows.every((row) => row.length === 1));
    assert.equal(layout.dividers.length, 10);
    assert.equal(format(layout.slots[0]!.start, "HH:mm"), "08:00");
    assert.equal(format(layout.slots.at(-1)!.end, "HH:mm"), "18:00");
    assert.equal(layout.slots[1]!.isDividerBoundary, true);
});

test("treats 24:00 as the exclusive end of a complete day", () => {
    const layout = createLayout({
        minTime: "00:00",
        maxTime: "24:00",
        slotDuration: 60,
        labelInterval: 60
    });

    assert.equal(layout.totalMinutes, 1_440);
    assert.equal(layout.slots.length, 24);
    assert.equal(format(layout.slots.at(-1)!.end, "yyyy-MM-dd HH:mm"), "2026-09-02 00:00");
});

test("keeps a final slot inside an uneven time window", () => {
    const layout = createLayout({
        minTime: "08:15",
        maxTime: "09:00",
        slotDuration: 30,
        labelInterval: 30
    });

    assert.equal(layout.totalMinutes, 45);
    assert.deepEqual(layout.slots.map(({ start, end, duration }) => ({
        start: format(start, "HH:mm"),
        end: format(end, "HH:mm"),
        duration
    })), [
        { start: "08:15", end: "08:45", duration: 30 },
        { start: "08:45", end: "09:00", duration: 15 }
    ]);
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

test("positions a transient interval without replacing the source event", () => {
    const event: TestEvent = {
        id: "resizing",
        title: "Resizing",
        start: date(1, 9),
        end: date(1, 10)
    };
    const layout = createLayout({ events: [event] });
    const positioned = createPositionedEvents({
        events: [event],
        columns: layout.columns,
        timeWindow: layout.timeWindow,
        getEventIds: () => new Set(),
        getEventInterval: () => ({
            start: event.start,
            end: date(1, 11)
        })
    });

    assert.equal(positioned[0]?.event, event);
    assert.equal(positioned[0]?.startRow, 61);
    assert.equal(positioned[0]?.endRow, 181);
});

test("duplicates multi-resource events only into assigned columns", () => {
    const resources = [
        { id: "room-a", name: "Room A" },
        { id: "room-b", name: "Room B" }
    ];
    const layout = createLayout({
        resources: { items: resources },
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
            resourceId: resource?.id
        })),
        [
            { id: "both", columnIndex: 0, resourceId: "room-a" },
            { id: "both", columnIndex: 1, resourceId: "room-b" },
            { id: "room-a-only", columnIndex: 0, resourceId: "room-a" }
        ]
    );
});

test("rejects missing and duplicate resource identifiers", () => {
    assert.throws(
        () => createLayout({
            resources: {
                items: [{ name: "Missing ID" }]
            }
        }),
        /resource at index 0 ID must be a non-empty string or finite number/
    );
    assert.throws(
        () => createLayout({
            resources: {
                items: [
                    { id: "room-a", name: "First" },
                    { id: "room-a", name: "Duplicate" }
                ]
            }
        }),
        /resource ID string "room-a" is duplicated at indexes 0 and 1/
    );
});

test("matches typed IDs by value and deduplicates event assignments", () => {
    const layout = createLayout({
        resources: {
            items: [
                { id: "1", name: "String" },
                { id: 1, name: "Number" }
            ],
            getEventIds: () => [1, 1]
        },
        events: [{
            id: "typed",
            title: "Typed identity",
            start: date(1, 9),
            end: date(1, 10)
        }]
    });

    assert.deepEqual(
        layout.events.map(({ resourceId }) => resourceId),
        [1]
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

test("uses wall-clock rows across Lisbon and New York daylight-saving changes", () => {
    const clockChangeDays = [
        new TZDate(2026, 2, 29, 0, 0, 0, 0, "Europe/Lisbon"),
        new TZDate(2026, 9, 25, 0, 0, 0, 0, "Europe/Lisbon"),
        new TZDate(2026, 2, 8, 0, 0, 0, 0, "America/New_York"),
        new TZDate(2026, 10, 1, 0, 0, 0, 0, "America/New_York")
    ];

    const results = clockChangeDays.map((day) => {
        const timeZone = day.timeZone;
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
        const layout = createLayout({
            days: [day],
            minTime: "00:00",
            maxTime: "24:00",
            events: [{
                id: `full-day-${day.getMonth()}`,
                title: "Full day",
                start: day,
                end: nextDay
            }]
        });
        const [segment] = layout.events;

        assert.ok(segment);
        return {
            timeZone,
            date: format(segment.start, "yyyy-MM-dd"),
            end: format(segment.end, "yyyy-MM-dd HH:mm"),
            startRow: segment.startRow,
            endRow: segment.endRow,
            slotCount: layout.slots.length
        };
    });

    assert.deepEqual(results, [
        { timeZone: "Europe/Lisbon", date: "2026-03-29", end: "2026-03-30 00:00", startRow: 1, endRow: 1441, slotCount: 24 },
        { timeZone: "Europe/Lisbon", date: "2026-10-25", end: "2026-10-26 00:00", startRow: 1, endRow: 1441, slotCount: 24 },
        { timeZone: "America/New_York", date: "2026-03-08", end: "2026-03-09 00:00", startRow: 1, endRow: 1441, slotCount: 24 },
        { timeZone: "America/New_York", date: "2026-11-01", end: "2026-11-02 00:00", startRow: 1, endRow: 1441, slotCount: 24 }
    ]);
});

test("keeps spring-forward divider labels on the requested wall-clock scale", () => {
    const timeZone = "Europe/Lisbon";
    const day = new TZDate(2026, 2, 29, 0, 0, 0, 0, timeZone);
    const layout = createLayout({
        days: [day],
        minTime: "00:00",
        maxTime: "05:00",
        slotDuration: 30,
        labelInterval: 60
    });

    assert.deepEqual(
        layout.dividers.map(({ time }) => format(time, "HH:mm")),
        ["00:00", "01:00", "02:00", "03:00", "04:00"]
    );
});

test("rejects invalid time scales", () => {
    assert.throws(
        () => createLayout({ minTime: "18:00", maxTime: "08:00" }),
        /maxTime must be after minTime/
    );
    assert.throws(
        () => createLayout({ minTime: "1970-01-01T08:00:00" as TimeOfDay }),
        /minTime must use HH:mm/
    );
    assert.throws(
        () => createLayout({ maxTime: "24:01" as TimeOfDay }),
        /maxTime must use HH:mm/
    );
    assert.throws(() => createLayout({ slotDuration: 0 }), /positive integer/);
    assert.throws(
        () => createLayout({ slotDuration: 30, labelInterval: 45 }),
        /integer multiple of slotDuration/
    );
    assert.throws(
        () => createLayout({ groupBy: "team" as GroupBy }),
        /groupBy must be either "day" or "resource"/
    );
});
