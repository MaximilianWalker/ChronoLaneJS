import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const packageEntry = new URL("../dist/index.js", import.meta.url).href;
const packageModule = await import(packageEntry) as typeof import("../src/index.js");
const {
    default: Calendar,
    DayView,
    TimeGridView,
    parseCalendarDate
} = packageModule;

const bundle = await readFile(new URL("../dist/index.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../dist/chronolanejs.css", import.meta.url), "utf8");

assert.match(bundle, /^"use client";/);
assert.doesNotMatch(bundle, /next\/dynamic|@mui|uni-sync/);
assert.match(styles, /\.time-grid-view/);
assert.equal(parseCalendarDate("2026-09-01").getDate(), 1);
assert.equal(typeof DayView, "function");
assert.equal(typeof TimeGridView, "function");

const markup = renderToStaticMarkup(createElement(Calendar, {
    view: "day",
    date: new Date(2026, 8, 1),
    events: [],
    showControls: false,
    minTime: new Date(2026, 8, 1, 8),
    maxTime: new Date(2026, 8, 1, 10)
}));

assert.match(markup, /class="calendar"/);
assert.match(markup, /class="time-grid-view"/);

console.log("Verified the built ChronoLaneJS package entry, styles, exports, and render path.");
