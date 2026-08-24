import assert from "node:assert/strict";
import test from "node:test";

import { enUS } from "date-fns/locale/en-US";

import type { ViewText } from "../../../src/components/eventPresentation.js";
import {
    defaultCalendarFormatters,
    defaultCalendarMessages
} from "../../../src/core/localization.js";
import { createHeaderModel } from "../../../src/views/time-grid/headerModel.js";
import { createLayout } from "../../../src/views/time-grid/layout/createLayout.js";
import { createHeaderRows } from "../../../src/views/time-grid/layout/headers.js";

interface Resource {
    id: string;
    name: string;
}

const text: ViewText = {
    formatters: defaultCalendarFormatters,
    messages: defaultCalendarMessages,
    context: { locale: enUS, view: "week" }
};

test("prepares hierarchical header occurrences and column labels", () => {
    const resources = {
        items: [
            { id: "room-a", name: "Room A" },
            { id: "room-b", name: "Room B" }
        ],
        getTitle: (resource: Resource) => resource.name
    };
    const layout = createLayout({
        days: [new Date(2026, 8, 14)],
        events: [],
        backgroundEvents: [],
        resources,
        groupBy: "day",
        minTime: "08:00",
        maxTime: "18:00",
        slotDuration: 60,
        labelInterval: 60
    });
    const rows = createHeaderRows(layout.columns, "day");
    const model = createHeaderModel(layout.columns, rows, resources, text);

    assert.equal(model.className, "time-grid-view_header has-resource-headers");
    assert.equal(model.hasResourceHeaders, true);
    assert.deepEqual(model.occurrences.map(({ kind, columnIndex, columnSpan }) => ({
        kind,
        columnIndex,
        columnSpan
    })), [
        { kind: "day", columnIndex: 0, columnSpan: 2 },
        { kind: "resource", columnIndex: 0, columnSpan: 1 },
        { kind: "resource", columnIndex: 1, columnSpan: 1 }
    ]);
    assert.deepEqual(model.columnLabels, [
        "Monday 14th, Room A",
        "Monday 14th, Room B"
    ]);
    assert.deepEqual(model.occurrences.map(({ style }) => style), [
        { gridColumn: "2 / span 2", gridRow: 1 },
        { gridColumn: "2 / span 1", gridRow: 2 },
        { gridColumn: "3 / span 1", gridRow: 2 }
    ]);
});
