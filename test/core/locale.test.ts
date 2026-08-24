import assert from 'node:assert/strict';
import test from 'node:test';

import { enUS } from 'date-fns/locale/en-US';
import { enGB } from 'date-fns/locale/en-GB';
import { faIR } from 'date-fns/locale/fa-IR';
import type { CalendarLocale } from '../../src/types.js';

import {
    DEFAULT_CALENDAR_LOCALE,
    calendarLocaleNames,
    getLoadedCalendarLocale,
    loadCalendarLocale,
    loadCalendarLocaleModule,
    resolveCalendarLocaleName,
    resolveCalendarWeekStart
} from '../../src/core/locale.js';

test('en-US is the synchronous default locale', () => {
    assert.equal(DEFAULT_CALENDAR_LOCALE, 'en-US');
    assert.strictEqual(getLoadedCalendarLocale(), enUS);
    assert.ok(calendarLocaleNames.includes('en-US'));
});

test('locale objects bypass name resolution and loading', async () => {
    assert.strictEqual(getLoadedCalendarLocale(enUS), enUS);
    assert.strictEqual(await loadCalendarLocale(enUS), enUS);
});

test('BCP 47 names resolve to exact locales, aliases, and language fallbacks', () => {
    assert.equal(resolveCalendarLocaleName('en-GB-u-hc-h23'), 'en-GB');
    assert.equal(resolveCalendarLocaleName('pt-PT'), 'pt');
    assert.equal(resolveCalendarLocaleName('sr-Latn-RS'), 'sr-Latn');
    assert.equal(resolveCalendarLocaleName('zh-Hant'), 'zh-TW');
});

test('non-default locales load once and are cached by resolved name', async () => {
    const firstLoad = loadCalendarLocale('pt-PT');
    const secondLoad = loadCalendarLocale('pt');

    assert.strictEqual(firstLoad, secondLoad);

    const locale = await firstLoad;
    assert.equal(locale.code, 'pt');
    assert.strictEqual(getLoadedCalendarLocale('pt-PT'), locale);
});

test('week start follows the locale unless explicitly overridden', async () => {
    const locale = await loadCalendarLocale('pt-PT');

    assert.equal(resolveCalendarWeekStart(locale), locale.options?.weekStartsOn ?? 0);
    assert.equal(resolveCalendarWeekStart(locale, 6), 6);
});

test('week starts cover Sunday, Monday, and Saturday locale conventions', () => {
    assert.equal(resolveCalendarWeekStart(enUS), 0);
    assert.equal(resolveCalendarWeekStart(enGB), 1);
    assert.equal(resolveCalendarWeekStart(faIR), 6);
    assert.equal(resolveCalendarWeekStart(faIR, 2), 2);
});

test('lazy locale module failures retain their cause and locale name', async () => {
    const networkError = new Error('network unavailable');

    await assert.rejects(
        loadCalendarLocaleModule('pt', () => Promise.reject(networkError)),
        (error: Error) => (
            error.message === 'Failed to load calendar locale "pt".'
            && error.cause === networkError
        )
    );
    await assert.rejects(
        loadCalendarLocaleModule('pt', () => Promise.resolve({ code: 'pt' })),
        (error: Error) => (
            error.message === 'Failed to load calendar locale "pt".'
            && error.cause instanceof TypeError
            && /Locale contract/.test(error.cause.message)
        )
    );
});

test('invalid and unsupported locale inputs fail explicitly', () => {
    assert.throws(
        () => resolveCalendarLocaleName('not_a_locale'),
        /not a valid locale name/
    );
    assert.throws(
        () => resolveCalendarLocaleName('tlh'),
        /not supported by date-fns/
    );
    assert.throws(
        () => getLoadedCalendarLocale({ code: 'custom' } as unknown as CalendarLocale),
        /date-fns Locale contract/
    );
});
