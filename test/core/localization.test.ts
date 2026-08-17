import assert from "node:assert/strict";
import test from "node:test";

import { enUS } from "date-fns/locale/en-US";
import { pt } from "date-fns/locale/pt";

import {
    defaultCalendarFormatters,
    defaultCalendarMessages
} from "../../src/core/localization.js";

const date = new Date(2026, 8, 14, 13, 5);
const range = { start: date, end: date, days: [date] };

test("default time formatting follows locale clock conventions", () => {
    assert.equal(
        defaultCalendarFormatters.time(date, { locale: enUS, view: "day" }),
        "1:05 PM"
    );
    assert.equal(
        defaultCalendarFormatters.time(date, { locale: pt, view: "day" }),
        "13:05"
    );
});

test("default date headings use the active locale and view", () => {
    assert.match(
        defaultCalendarFormatters.dayHeader(date, { locale: pt, view: "agenda" }),
        /segunda-feira.*setembro.*2026/i
    );
    const header = defaultCalendarFormatters.rangeHeader(range, {
        locale: enUS,
        view: "day"
    });
    if (typeof header !== "string") {
        assert.fail("The default range header must be a string.");
    }
    assert.match(header, /Monday, September 14th, 2026/);
});

test("default messages compose prepared values without formatting dates", () => {
    assert.equal(defaultCalendarMessages.previous({ view: "day", range }), "Previous day");
    assert.equal(defaultCalendarMessages.slotLabel({
        view: "day",
        date: "Monday, September 14th, 2026",
        time: "1:05 PM"
    }), "Calendar slot, Monday, September 14th, 2026, 1:05 PM");
    assert.equal(defaultCalendarMessages.eventLabel({
        view: "day",
        title: "Planning",
        startDate: "Monday",
        startTime: "1:05 PM",
        endDate: "Monday",
        endTime: "2:05 PM"
    }), "Planning, Monday, 1:05 PM to Monday, 2:05 PM");
    assert.equal(defaultCalendarMessages.eventMoveHandle({
        view: "day",
        title: "Planning"
    }), "Move Planning");
    assert.equal(defaultCalendarMessages.eventMoveTarget({
        view: "day",
        title: "Planning",
        date: "Tuesday, September 15th, 2026",
        time: "10:00 AM",
        resource: "Studio"
    }), "Move Planning to Tuesday, September 15th, 2026, 10:00 AM, Studio");
    assert.equal(defaultCalendarMessages.eventResizeHandle({
        view: "day",
        edge: "end",
        title: "Planning",
        date: "Monday, September 14th, 2026",
        time: "2:05 PM"
    }), "Resize end of Planning, Monday, September 14th, 2026, 2:05 PM");
});

test("default localization registries are stable immutable objects", () => {
    assert.ok(Object.isFrozen(defaultCalendarFormatters));
    assert.ok(Object.isFrozen(defaultCalendarMessages));
});
