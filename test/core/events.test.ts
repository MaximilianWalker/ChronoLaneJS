import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEvents } from "../../src/core/events.js";

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
