import assert from "node:assert/strict";
import test from "node:test";

import { TZDate } from "@date-fns/tz";
import { format } from "date-fns/format";

import {
    normalizeCalendarSelectedDate,
    normalizeCalendarSelectionRange
} from "../../src/core/selection.js";

test("normalizes selected dates in the configured time zone", () => {
    const selectedDate = normalizeCalendarSelectedDate(
        "2026-09-14T10:30:00",
        "Europe/Lisbon"
    );

    assert.ok(selectedDate instanceof TZDate);
    assert.equal(selectedDate.timeZone, "Europe/Lisbon");
    assert.equal(format(selectedDate, "yyyy-MM-dd HH:mm"), "2026-09-14 10:30");
});

test("normalizes selection boundaries without mutating Date inputs", () => {
    const start = new Date(2026, 8, 14, 10);
    const end = new Date(2026, 8, 14, 12);
    const selection = normalizeCalendarSelectionRange(
        { start, end },
        "Asia/Tokyo"
    );

    assert.notEqual(selection.start, start);
    assert.notEqual(selection.end, end);
    assert.ok(selection.start instanceof TZDate);
    assert.equal(selection.start.timeZone, "Asia/Tokyo");
    assert.equal(format(selection.start, "yyyy-MM-dd HH:mm"), "2026-09-14 10:00");
    assert.equal(format(selection.end, "yyyy-MM-dd HH:mm"), "2026-09-14 12:00");
});

test("rejects invalid selected dates and range boundaries", () => {
    assert.throws(
        () => normalizeCalendarSelectedDate("not-a-date"),
        { name: "TypeError", message: "Calendar selection date must be a valid date." }
    );
    assert.throws(
        () => normalizeCalendarSelectionRange({
            start: "not-a-date",
            end: "2026-09-14T12:00:00"
        }),
        { name: "TypeError", message: "Calendar selection start must be a valid date." }
    );
    assert.throws(
        () => normalizeCalendarSelectionRange({
            start: "2026-09-14T10:00:00",
            end: "not-a-date"
        }),
        { name: "TypeError", message: "Calendar selection end must be a valid date." }
    );
});

test("rejects empty and reversed selection ranges", () => {
    assert.throws(
        () => normalizeCalendarSelectionRange({
            start: "2026-09-14T10:00:00",
            end: "2026-09-14T10:00:00"
        }),
        { name: "RangeError", message: "Calendar selection range end must be after its start." }
    );
    assert.throws(
        () => normalizeCalendarSelectionRange({
            start: "2026-09-14T12:00:00",
            end: "2026-09-14T10:00:00"
        }),
        { name: "RangeError", message: "Calendar selection range end must be after its start." }
    );
});
