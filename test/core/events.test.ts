import assert from "node:assert/strict";
import test from "node:test";

import {
    normalizeEventCollection,
    normalizeEvents
} from "../../src/core/events.js";

test("normalizes valid event boundaries", () => {
    const [event] = normalizeEvents([{
        id: "planning",
        start: "2026-09-14T09:00:00",
        end: "2026-09-14T10:00:00"
    }], "UTC");

    assert.ok(event?.start instanceof Date);
    assert.ok(event?.end instanceof Date);
    assert.equal(event?.start.getHours(), 9);
});

test("reports the event index and invalid boundary", () => {
    assert.throws(
        () => normalizeEvents([{
            start: "invalid",
            end: "2026-09-14T10:00:00"
        }]),
        /event at index 0 start must be valid/
    );
    assert.throws(
        () => normalizeEvents([{
            start: "2026-09-14T09:00:00",
            end: "invalid"
        }]),
        /event at index 0 end must be valid/
    );
});

test("rejects empty and reversed event intervals", () => {
    assert.throws(
        () => normalizeEvents([{
            start: "2026-09-14T09:00:00",
            end: "2026-09-14T09:00:00"
        }]),
        /event at index 0 end must be later than start/
    );
    assert.throws(
        () => normalizeEvents([{
            start: "2026-09-14T10:00:00",
            end: "2026-09-14T09:00:00"
        }]),
        /event at index 0 end must be later than start/
    );
});

test("assigns unique deterministic identities to duplicate events", () => {
    const inputs = [
        {
            id: "duplicate",
            title: "Planning",
            start: "2026-09-14T09:00:00",
            end: "2026-09-14T10:00:00"
        },
        {
            id: "duplicate",
            title: "Planning",
            start: "2026-09-14T09:00:00",
            end: "2026-09-14T10:00:00"
        },
        {
            title: "Review",
            start: "2026-09-14T10:00:00",
            end: "2026-09-14T11:00:00"
        },
        {
            title: "Review",
            start: "2026-09-14T10:00:00",
            end: "2026-09-14T11:00:00"
        }
    ];
    const first = normalizeEventCollection(inputs, "UTC");
    const second = normalizeEventCollection(inputs, "UTC");
    const firstKeys = first.events.map(first.getKey);
    const secondKeys = second.events.map(second.getKey);

    assert.equal(new Set(firstKeys).size, inputs.length);
    assert.deepEqual(firstKeys, secondKeys);
    assert.throws(
        () => first.getKey(second.events[0]!),
        /does not belong to this normalized collection/
    );
});
