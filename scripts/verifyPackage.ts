import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createElement } from "react";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const packageEntry = new URL("../dist/index.js", import.meta.url).href;
const packageModule = await import(packageEntry) as typeof import("../src/index.js");
const {
    default: Calendar,
    DayView,
    TimeGridView,
    defaultCalendarViews,
    defaultCalendarFormatters,
    defaultCalendarMessages,
    parseCalendarDate
} = packageModule;

const bundle = await readFile(new URL("../dist/index.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../dist/chronolanejs.css", import.meta.url), "utf8");
const runtimeExports = [
    "AgendaView",
    "DEFAULT_CALENDAR_LOCALE",
    "DayView",
    "MonthView",
    "TimeGridView",
    "WeekView",
    "asCalendarDate",
    "calendarDateFromTimestamp",
    "calendarLocaleNames",
    "default",
    "defaultCalendarFormatters",
    "defaultCalendarMessages",
    "defaultCalendarViews",
    "loadCalendarLocale",
    "parseCalendarDate",
    "preloadCalendarLocale",
    "resolveCalendarLocaleName",
    "resolveCalendarRange",
    "toCalendarTimeZone"
];

assert.match(bundle, /^"use client";/);
assert.doesNotMatch(bundle, /next\/dynamic|@mui|uni-sync/);
assert.match(styles, /\.time-grid-view/);
assert.deepEqual(Object.keys(packageModule).sort(), runtimeExports);
assert.equal(parseCalendarDate("2026-09-01").getDate(), 1);
assert.equal(typeof DayView, "function");
assert.equal(typeof TimeGridView, "function");
assert.equal("resource" in defaultCalendarViews, false);
assert.equal(typeof defaultCalendarFormatters.time, "function");
assert.equal(typeof defaultCalendarMessages.eventLabel, "function");

const markup = renderToStaticMarkup(createElement(Calendar, {
    view: "day",
    date: new Date(2026, 8, 1),
    events: [],
    showControls: false,
    viewProps: {
        minTime: "08:00",
        maxTime: "10:00"
    }
}));

assert.match(markup, /class="calendar"/);
assert.match(markup, /class="time-grid-view(?:\s|")/);
assert.match(markup, /time-grid-view_day-header is-primary/);
assert.doesNotMatch(markup, /time-grid-view_resource-header/);
assert.doesNotMatch(styles, /\.time-grid-view_column-header/);

const UntypedCalendar = Calendar as unknown as ComponentType<Record<string, unknown>>;
const rejectedRootViewPropsMarkup = renderToStaticMarkup(createElement(
    UntypedCalendar,
    {
        view: "day",
        date: new Date(2026, 8, 1),
        events: [],
        showControls: false,
        slotSizing: { width: 123 }
    }
));
const nestedViewPropsMarkup = renderToStaticMarkup(createElement(Calendar, {
    view: "day",
    date: new Date(2026, 8, 1),
    events: [],
    showControls: false,
    viewProps: { slotSizing: { width: 123 } }
}));

assert.doesNotMatch(rejectedRootViewPropsMarkup, /has-fixed-slot-width/);
assert.match(nestedViewPropsMarkup, /has-fixed-slot-width/);

const groupedMarkup = renderToStaticMarkup(createElement(Calendar, {
    view: "week",
    date: new Date(2026, 8, 1),
    events: [{
        id: "planning",
        title: "Planning",
        start: new Date(2026, 8, 1, 9),
        end: new Date(2026, 8, 1, 10),
        resourceId: "room-a"
    }],
    viewProps: {
        resources: {
            items: [
                { id: "room-a", name: "Room A" },
                { id: "room-b", name: "Room B" }
            ]
        },
        groupBy: "resource",
        minTime: "08:00",
        maxTime: "10:00"
    },
    showControls: false
}));

assert.match(groupedMarkup, /data-group-by="resource"/);
assert.match(groupedMarkup, /time-grid-view_resource-header is-primary/);
assert.match(groupedMarkup, /time-grid-view_day-header is-secondary/);

console.log("Verified the built ChronoLaneJS package entry, styles, exports, and render path.");
