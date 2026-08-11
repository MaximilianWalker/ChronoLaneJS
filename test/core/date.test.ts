import assert from 'node:assert/strict';
import test from 'node:test';

import { addDays, format, startOfWeek } from 'date-fns';

import {
    calendarDateFromTimestamp,
    parseCalendarDate,
    toCalendarTimeZone
} from '../../src/core/date.js';

test('date-only values retain their calendar day outside UTC', () => {
    const date = parseCalendarDate('2026-09-01');

    assert.equal(date.getFullYear(), 2026);
    assert.equal(date.getMonth(), 8);
    assert.equal(date.getDate(), 1);
    assert.equal(date.getHours(), 0);
});

test('calendar fields are preserved in the configured time zone', () => {
    const localDate = new Date(2026, 8, 1, 8, 30);
    const lisbonDate = toCalendarTimeZone(localDate, 'Europe/Lisbon');

    assert.equal(lisbonDate.timeZone, 'Europe/Lisbon');
    assert.equal(format(lisbonDate, 'yyyy-MM-dd HH:mm'), '2026-09-01 08:30');
    assert.equal(format(startOfWeek(lisbonDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'), '2026-08-31');
    assert.equal(format(addDays(lisbonDate, 1), 'yyyy-MM-dd HH:mm'), '2026-09-02 08:30');
});

test('timestamp clones retain the configured time zone', () => {
    const zonedDate = toCalendarTimeZone(new Date(2026, 8, 1, 8, 30), 'Europe/Lisbon');
    const clone = calendarDateFromTimestamp(zonedDate.getTime(), 'Europe/Lisbon');

    assert.equal(clone.timeZone, 'Europe/Lisbon');
    assert.equal(clone.getTime(), zonedDate.getTime());
    assert.equal(format(clone, 'yyyy-MM-dd HH:mm'), '2026-09-01 08:30');
});
