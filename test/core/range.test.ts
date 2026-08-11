import assert from 'node:assert/strict';
import test from 'node:test';

import { format, startOfWeek } from 'date-fns';

import {
    createCalendarRange,
    moveCalendarDate,
    resolveCalendarRange
} from '../../src/core/range.js';

const date = (day: number): Date => new Date(2026, 8, day);
const dates = (range: Date[]): string[] => (
    range.map((day) => format(day, 'yyyy-MM-dd'))
);

test('day and week presets resolve from the supplied anchor', () => {
    assert.deepEqual(dates(resolveCalendarRange('day', date(2))), ['2026-09-02']);
    assert.deepEqual(
        dates(resolveCalendarRange('week', date(2), { weekStartsOn: 1 })),
        [
            '2026-08-31',
            '2026-09-01',
            '2026-09-02',
            '2026-09-03',
            '2026-09-04',
            '2026-09-05',
            '2026-09-06'
        ]
    );
});

test('a range can express work days without a dedicated work-week view', () => {
    const workDays = resolveCalendarRange({
        start: (anchor) => startOfWeek(anchor, { weekStartsOn: 1 }),
        days: 7,
        includeDay: (day) => day.getDay() >= 1 && day.getDay() <= 5,
        navigationStep: 7
    }, date(2));

    assert.deepEqual(dates(workDays), [
        '2026-08-31',
        '2026-09-01',
        '2026-09-02',
        '2026-09-03',
        '2026-09-04'
    ]);
});

test('range callbacks can return non-contiguous visible days', () => {
    const range = resolveCalendarRange((anchor) => [
        anchor,
        new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 2),
        new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 4)
    ], date(1));

    assert.deepEqual(dates(range), ['2026-09-01', '2026-09-03', '2026-09-05']);
});

test('explicit ranges normalize duplicate days and reject empty filters', () => {
    assert.deepEqual(
        dates(resolveCalendarRange([date(2), date(1), date(2)], date(1))),
        ['2026-09-01', '2026-09-02']
    );
    assert.equal(createCalendarRange({
        start: date(1),
        days: 7,
        includeDay: () => false
    }).length, 0);
    assert.throws(() => resolveCalendarRange({
        start: date(1),
        days: 7,
        includeDay: () => false
    }, date(1)), /retain at least one day/);
});

test('navigation moves by an explicit caller-controlled step', () => {
    assert.equal(format(moveCalendarDate(date(1), 1, 7), 'yyyy-MM-dd'), '2026-09-08');
    assert.equal(format(moveCalendarDate(date(1), -1, 5), 'yyyy-MM-dd'), '2026-08-27');
});
