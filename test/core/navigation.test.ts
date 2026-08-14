import assert from "node:assert/strict";
import test from "node:test";

import { TZDate } from "@date-fns/tz";
import { format } from "date-fns/format";

import {
    getCalendarNavigationState,
    normalizeCalendarNavigationBoundaries,
    resolveCalendarNavigationDate
} from "../../src/core/navigation.js";

test("normalizes inclusive navigation boundaries in the configured time zone", () => {
    const minInput = new Date(2026, 8, 14, 10, 30);
    const boundaries = normalizeCalendarNavigationBoundaries(
        minInput,
        "2026-09-30",
        "Europe/Lisbon"
    );

    assert.notEqual(boundaries.minDate, minInput);
    assert.ok(boundaries.minDate instanceof TZDate);
    assert.equal(boundaries.minDate.timeZone, "Europe/Lisbon");
    assert.equal(format(boundaries.minDate, "yyyy-MM-dd HH:mm"), "2026-09-14 00:00");
    assert.equal(format(boundaries.maxDate!, "yyyy-MM-dd HH:mm"), "2026-09-30 00:00");
});

test("rejects invalid or reversed navigation boundaries", () => {
    assert.throws(
        () => normalizeCalendarNavigationBoundaries("not-a-date", null),
        { name: "TypeError", message: "Calendar minDate must be a valid date." }
    );
    assert.throws(
        () => normalizeCalendarNavigationBoundaries(null, "not-a-date"),
        { name: "TypeError", message: "Calendar maxDate must be a valid date." }
    );
    assert.throws(
        () => normalizeCalendarNavigationBoundaries("2026-09-30", "2026-09-14"),
        { name: "RangeError", message: "Calendar maxDate must not be before minDate." }
    );
});

test("disables outward navigation for ranges that partially overlap boundaries", () => {
    const boundaries = normalizeCalendarNavigationBoundaries(
        "2026-09-16",
        "2026-09-18"
    );

    assert.deepEqual(getCalendarNavigationState({
        anchorDate: new Date(2026, 8, 17),
        periodStart: new Date(2026, 8, 14),
        periodEnd: new Date(2026, 8, 20),
        ...boundaries
    }), {
        previousDisabled: true,
        nextDisabled: true
    });
});

test("keeps only the recovery direction enabled for controlled anchors outside boundaries", () => {
    const boundaries = normalizeCalendarNavigationBoundaries(
        "2026-09-14",
        "2026-09-30"
    );

    assert.deepEqual(getCalendarNavigationState({
        anchorDate: new Date(2026, 8, 1),
        periodStart: new Date(2026, 8, 1),
        periodEnd: new Date(2026, 9, 7),
        ...boundaries
    }), {
        previousDisabled: true,
        nextDisabled: false
    });
    assert.deepEqual(getCalendarNavigationState({
        anchorDate: new Date(2026, 9, 5),
        periodStart: new Date(2026, 8, 1),
        periodEnd: new Date(2026, 9, 11),
        ...boundaries
    }), {
        previousDisabled: false,
        nextDisabled: true
    });
});

test("compares anchor days instead of their time fields", () => {
    const boundaries = normalizeCalendarNavigationBoundaries(
        "2026-09-14",
        "2026-09-30"
    );

    assert.deepEqual(getCalendarNavigationState({
        anchorDate: new Date(2026, 8, 14, 15),
        periodStart: new Date(2026, 8, 15),
        periodEnd: new Date(2026, 8, 16),
        ...boundaries
    }), {
        previousDisabled: true,
        nextDisabled: false
    });
});

test("recovers out-of-bounds anchors before clamping ordinary proposals", () => {
    const boundaries = normalizeCalendarNavigationBoundaries(
        "2026-09-14",
        "2026-09-30"
    );
    const recoveryFromBefore = resolveCalendarNavigationDate(
        new Date(2026, 8, 1),
        "2026-10-05T10:30:00",
        boundaries
    );
    const recoveryFromAfter = resolveCalendarNavigationDate(
        new Date(2026, 9, 5),
        "2026-09-01T10:30:00",
        boundaries
    );
    const before = resolveCalendarNavigationDate(
        new Date(2026, 8, 20),
        "2026-09-01T10:30:00",
        boundaries
    );
    const after = resolveCalendarNavigationDate(
        new Date(2026, 8, 20),
        "2026-10-05T10:30:00",
        boundaries
    );
    const onBoundary = resolveCalendarNavigationDate(
        new Date(2026, 8, 20),
        "2026-09-14T10:30:00",
        boundaries
    );

    assert.equal(format(recoveryFromBefore, "yyyy-MM-dd HH:mm"), "2026-09-14 00:00");
    assert.equal(format(recoveryFromAfter, "yyyy-MM-dd HH:mm"), "2026-09-30 00:00");
    assert.equal(format(before, "yyyy-MM-dd HH:mm"), "2026-09-14 00:00");
    assert.equal(format(after, "yyyy-MM-dd HH:mm"), "2026-09-30 00:00");
    assert.equal(format(onBoundary, "yyyy-MM-dd HH:mm"), "2026-09-14 10:30");
    assert.throws(
        () => resolveCalendarNavigationDate(
            new Date(2026, 8, 1),
            "not-a-date",
            boundaries
        ),
        { name: "TypeError", message: "Calendar dates must be valid." }
    );
});
