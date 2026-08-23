import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEventCollection } from "../../../src/core/events.js";
import type { NormalizedCalendarEvent } from "../../../src/types.js";
import { createGroups } from "../../../src/views/agenda/layout.js";

const day = (offset: number, hour = 0) => new Date(2026, 8, 14 + offset, hour);
const event = (
    id: string,
    start: Date,
    end: Date
): NormalizedCalendarEvent => ({ id, start, end });

test("assigns a multi-day event to its earliest visible day once", () => {
    const groups = createGroups(
        [day(0), day(1), day(2)],
        normalizeEventCollection([
            event("later", day(1, 11), day(1, 12)),
            event("multi", day(-1, 10), day(2, 10))
        ])
    );

    assert.equal(groups.length, 2);
    assert.deepEqual(groups.map((group) => group.day), [day(0), day(1)]);
    assert.deepEqual(
        groups.map((group) => group.events.map((item) => item.event.id)),
        [["multi"], ["later"]]
    );
});

test("omits days without an event occurrence", () => {
    const groups = createGroups(
        [day(0), day(1)],
        normalizeEventCollection([event("single", day(1, 9), day(1, 10))])
    );

    assert.deepEqual(groups.map((group) => group.day), [day(1)]);
});

test("keeps duplicate source identities distinct", () => {
    const duplicate = event("duplicate", day(0, 9), day(0, 10));
    const groups = createGroups(
        [day(0)],
        normalizeEventCollection([duplicate, duplicate])
    );
    const keys = groups[0]?.events.map((item) => item.key) ?? [];

    assert.equal(new Set(keys).size, 2);
});
