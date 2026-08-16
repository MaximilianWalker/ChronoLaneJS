import assert from "node:assert/strict";
import test from "node:test";

import { addDays, format, startOfWeek } from "date-fns";

import {
    createCalendarRange,
    moveCalendarDate,
    resolveCalendarRange
} from "../../src/core/range.js";
import type {
    CalendarRangeDefinition,
    CalendarRangeOptions
} from "../../src/types.js";

const date = (day: number): Date => new Date(2026, 8, day);
const dates = (range: Date[]): string[] => (
    range.map((day) => format(day, "yyyy-MM-dd"))
);

test("day and week presets resolve their days and navigation together", () => {
    const day = resolveCalendarRange("day", date(2));
    const week = resolveCalendarRange("week", date(2), { weekStartsOn: 1 });

    assert.deepEqual(dates(day.days), ["2026-09-02"]);
    assert.equal(format(day.navigate(1), "yyyy-MM-dd"), "2026-09-03");
    assert.deepEqual(dates(week.days), [
        "2026-08-31",
        "2026-09-01",
        "2026-09-02",
        "2026-09-03",
        "2026-09-04",
        "2026-09-05",
        "2026-09-06"
    ]);
    assert.equal(format(week.navigate(-1), "yyyy-MM-dd"), "2026-08-26");
});

test("numeric ranges own their matching navigation step", () => {
    const range = resolveCalendarRange(3, date(1));

    assert.deepEqual(dates(range.days), [
        "2026-09-01",
        "2026-09-02",
        "2026-09-03"
    ]);
    assert.equal(format(range.navigate(1), "yyyy-MM-dd"), "2026-09-04");
    assert.equal(format(range.navigate(-1), "yyyy-MM-dd"), "2026-08-29");
});

test("callback-produced work weeks retain their navigation strategy", () => {
    const range = resolveCalendarRange((anchor, { weekStartsOn }) => ({
        start: startOfWeek(anchor, { weekStartsOn }),
        dayCount: 7,
        includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5,
        navigation: { stepDays: 7 }
    }), date(2), { weekStartsOn: 1 });

    assert.deepEqual(dates(range.days), [
        "2026-08-31",
        "2026-09-01",
        "2026-09-02",
        "2026-09-03",
        "2026-09-04"
    ]);
    assert.equal(format(range.navigate(1), "yyyy-MM-dd"), "2026-09-09");
});

test("non-contiguous dates can carry an explicit navigation strategy", () => {
    const definition: CalendarRangeDefinition = {
        dates: (anchor) => [
            addDays(anchor, 4),
            anchor,
            addDays(anchor, 2),
            addDays(anchor, 2)
        ],
        navigation: { stepDays: 7 }
    };
    const range = resolveCalendarRange(definition, date(1));
    const nextRange = resolveCalendarRange(definition, range.navigate(1));

    assert.deepEqual(dates(range.days), [
        "2026-09-01",
        "2026-09-03",
        "2026-09-05"
    ]);
    assert.equal(format(range.navigate(1), "yyyy-MM-dd"), "2026-09-08");
    assert.deepEqual(dates(nextRange.days), [
        "2026-09-08",
        "2026-09-10",
        "2026-09-12"
    ]);
});

test("custom navigation receives the resolved range and range context", () => {
    const nextAnchor = date(15);
    const options: CalendarRangeOptions = {
        dayCount: 3,
        navigation: {
            resolveAnchor: (anchor, direction, range, context) => {
                assert.deepEqual(dates(range.days), [
                    "2026-09-01",
                    "2026-09-02",
                    "2026-09-03"
                ]);
                assert.equal(context.weekStartsOn, 1);
                return direction === 1 ? nextAnchor : addDays(anchor, -14);
            }
        }
    };
    const range = resolveCalendarRange(options, date(1), { weekStartsOn: 1 });

    const resolvedNextAnchor = range.navigate(1);

    assert.equal(format(resolvedNextAnchor, "yyyy-MM-dd"), "2026-09-15");
    assert.notEqual(resolvedNextAnchor, nextAnchor);
    assert.equal(format(range.navigate(-1), "yyyy-MM-dd"), "2026-08-18");
});

test("derived navigation uses the unfiltered range span", () => {
    const filteredRange = resolveCalendarRange({
        start: date(1),
        dayCount: 7,
        includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5
    }, date(1));
    const explicitDates = resolveCalendarRange(
        [date(1), date(3), date(5)],
        date(1)
    );

    assert.equal(format(filteredRange.navigate(1), "yyyy-MM-dd"), "2026-09-08");
    assert.equal(format(explicitDates.navigate(1), "yyyy-MM-dd"), "2026-09-06");
});

test("range definitions reject empty, conflicting, and incomplete shapes", () => {
    assert.equal(createCalendarRange({
        start: date(1),
        dayCount: 7,
        includeDay: () => false
    }).length, 0);
    assert.throws(() => resolveCalendarRange({
        start: date(1),
        dayCount: 7,
        includeDay: () => false
    }, date(1)), /retain at least one day/);
    assert.throws(() => resolveCalendarRange({
        dates: [date(1)],
        start: date(1)
    } as unknown as CalendarRangeDefinition, date(1)), /cannot be combined/);
    assert.throws(() => resolveCalendarRange({
        start: date(1)
    } as CalendarRangeDefinition, date(1)), /exactly one of end or dayCount/);
});

test("range navigation validates its configuration and custom result", () => {
    assert.throws(() => resolveCalendarRange({
        dayCount: 1,
        navigation: { stepDays: 0 }
    }, date(1)), /stepDays must be a positive integer/);
    assert.throws(() => resolveCalendarRange({
        dayCount: 1,
        navigation: {
            stepDays: 1,
            resolveAnchor: () => date(2)
        }
    } as unknown as CalendarRangeDefinition, date(1)), /exactly one/);

    const invalidResult = resolveCalendarRange({
        dayCount: 1,
        navigation: {
            resolveAnchor: () => "2026-09-02" as unknown as Date
        }
    }, date(1));
    assert.throws(
        () => invalidResult.navigate(1),
        { name: "TypeError", message: "Calendar range navigation must resolve to a valid Date." }
    );
});

test("the standalone movement helper validates direction and day step", () => {
    assert.equal(format(moveCalendarDate(date(1), 1, 7), "yyyy-MM-dd"), "2026-09-08");
    assert.equal(format(moveCalendarDate(date(1), -1, 5), "yyyy-MM-dd"), "2026-08-27");
    assert.throws(
        () => moveCalendarDate(date(1), 0 as -1, 1),
        /direction must be -1 or 1/
    );
    assert.throws(
        () => moveCalendarDate(date(1), 1, 0),
        /stepDays must be a positive integer/
    );
});
