import assert from "node:assert/strict";
import test from "node:test";

import { createEventPresentation } from "../../src/components/eventPresentation.js";
import {
    defaultCalendarFormatters,
    defaultCalendarMessages
} from "../../src/core/localization.js";
import { defaultCalendarLocale } from "../../src/core/locale.js";
import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../src/types.js";

interface TestEvent extends CalendarEvent {
    id: string;
}

const event: NormalizedCalendarEvent<TestEvent> = {
    id: "planning",
    title: "Planning",
    description: "Set priorities for the week",
    start: new Date(2026, 8, 14, 9),
    end: new Date(2026, 8, 14, 10)
};
const occurrence = {
    day: new Date(2026, 8, 14),
    resource: null,
    resourceId: null
};
const text = {
    formatters: defaultCalendarFormatters,
    messages: defaultCalendarMessages,
    context: { locale: defaultCalendarLocale, view: "agenda" }
};

test("creates selection, interaction, and formatted presentation data", () => {
    const presentation = createEventPresentation({
        event,
        occurrence,
        behavior: {
            selectedIds: ["planning"],
            onSelect: () => undefined
        },
        text
    });

    assert.equal(presentation.selected, true);
    assert.equal(presentation.interactionProps.tabIndex, 0);
    assert.equal(typeof presentation.ariaLabel, "string");
    assert.equal(presentation.ariaLabel, presentation.details);
    assert.match(presentation.details, /Planning/);
    assert.match(presentation.details, /Set priorities for the week/);
    assert.match(presentation.details, /9:00 AM/);
    assert.match(presentation.details, /10:00 AM/);
    assert.notEqual(presentation.startDate, "");
    assert.notEqual(presentation.startTime, "");
    assert.notEqual(presentation.endDate, "");
    assert.notEqual(presentation.endTime, "");
});

test("omits interactive labeling when an occurrence has no behavior", () => {
    const presentation = createEventPresentation({
        event,
        occurrence,
        behavior: { selectedIds: [] },
        text
    });

    assert.equal(presentation.selected, false);
    assert.equal(presentation.interactionProps.tabIndex, undefined);
    assert.equal(presentation.ariaLabel, undefined);
    assert.match(presentation.details, /Planning/);
});
