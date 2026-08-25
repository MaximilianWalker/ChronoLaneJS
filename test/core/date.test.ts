import assert from 'node:assert/strict';
import test from 'node:test';

import { addDays, format, startOfWeek } from 'date-fns';

import {
    asCalendarDate,
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

test('zoned dates retain their calendar fields when normalized again', () => {
    const zonedDate = toCalendarTimeZone(new Date(2026, 8, 14), 'Europe/Lisbon');
    const nextWeek = addDays(zonedDate, 7);
    const normalized = asCalendarDate(nextWeek, 'Europe/Lisbon');

    assert.equal(normalized.getTime(), nextWeek.getTime());
    assert.equal(format(normalized, 'yyyy-MM-dd'), '2026-09-21');
});

test('absolute timestamps resolve across positive, negative, and fractional offsets', () => {
    const timestamp = Date.UTC(2026, 8, 14, 12);
    const results = [
        'Pacific/Honolulu',
        'America/New_York',
        'Europe/Lisbon',
        'Asia/Kathmandu',
        'Pacific/Auckland'
    ].map((timeZone) => ({
        timeZone,
        value: format(
            calendarDateFromTimestamp(timestamp, timeZone),
            'yyyy-MM-dd HH:mm XXX'
        )
    }));

    assert.deepEqual(results, [
        { timeZone: 'Pacific/Honolulu', value: '2026-09-14 02:00 -10:00' },
        { timeZone: 'America/New_York', value: '2026-09-14 08:00 -04:00' },
        { timeZone: 'Europe/Lisbon', value: '2026-09-14 13:00 +01:00' },
        { timeZone: 'Asia/Kathmandu', value: '2026-09-14 17:45 +05:45' },
        { timeZone: 'Pacific/Auckland', value: '2026-09-15 00:00 +12:00' }
    ]);
});

test('absolute timestamps expose both sides of daylight-saving boundaries', () => {
    const boundaries = [
        {
            timeZone: 'America/New_York',
            before: '2026-03-08T06:30:00Z',
            after: '2026-03-08T07:30:00Z'
        },
        {
            timeZone: 'America/New_York',
            before: '2026-11-01T05:30:00Z',
            after: '2026-11-01T06:30:00Z'
        },
        {
            timeZone: 'Europe/Lisbon',
            before: '2026-03-29T00:30:00Z',
            after: '2026-03-29T01:30:00Z'
        },
        {
            timeZone: 'Europe/Lisbon',
            before: '2026-10-25T00:30:00Z',
            after: '2026-10-25T01:30:00Z'
        }
    ].map(({ timeZone, before, after }) => ({
        timeZone,
        before: format(
            calendarDateFromTimestamp(Date.parse(before), timeZone),
            'yyyy-MM-dd HH:mm XXX'
        ),
        after: format(
            calendarDateFromTimestamp(Date.parse(after), timeZone),
            'yyyy-MM-dd HH:mm XXX'
        )
    }));

    assert.deepEqual(boundaries, [
        {
            timeZone: 'America/New_York',
            before: '2026-03-08 01:30 -05:00',
            after: '2026-03-08 03:30 -04:00'
        },
        {
            timeZone: 'America/New_York',
            before: '2026-11-01 01:30 -04:00',
            after: '2026-11-01 01:30 -05:00'
        },
        {
            timeZone: 'Europe/Lisbon',
            before: '2026-03-29 00:30 Z',
            after: '2026-03-29 02:30 +01:00'
        },
        {
            timeZone: 'Europe/Lisbon',
            before: '2026-10-25 01:30 +01:00',
            after: '2026-10-25 01:30 Z'
        }
    ]);
});
