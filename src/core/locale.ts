import { enUS } from "date-fns/locale/en-US";
import type { Locale } from "date-fns";

import { calendarLocaleLoaders } from "./localeLoaders.generated.js";
import type { CalendarLocale, CalendarWeekStart } from "../types.js";

export const DEFAULT_CALENDAR_LOCALE = "en-US";
export const defaultCalendarLocale = enUS;

const localeAliases: Readonly<Record<string, string>> = Object.freeze({
    en: "en-US",
    "pt-PT": "pt",
    zh: "zh-CN",
    "zh-Hans": "zh-CN",
    "zh-Hant": "zh-TW"
});
const directLocaleNames = new Set([
    DEFAULT_CALENDAR_LOCALE,
    ...Object.keys(calendarLocaleLoaders)
]);
const loadedLocales = new Map<string, Locale>([
    [DEFAULT_CALENDAR_LOCALE, defaultCalendarLocale]
]);
const pendingLocales = new Map<string, Promise<Locale>>();

export const calendarLocaleNames = Object.freeze(Array.from(new Set([
    ...directLocaleNames,
    ...Object.keys(localeAliases)
])).sort());

const isDateFnsLocale = (locale: unknown): locale is Locale => Boolean(
    locale
    && typeof locale === "object"
    && "code" in locale
    && typeof locale.code === "string"
    && "localize" in locale
    && typeof locale.localize === "object"
    && locale.localize !== null
    && "month" in locale.localize
    && typeof locale.localize.month === "function"
    && "day" in locale.localize
    && typeof locale.localize.day === "function"
    && "formatLong" in locale
    && typeof locale.formatLong === "object"
    && locale.formatLong !== null
    && "date" in locale.formatLong
    && typeof locale.formatLong.date === "function"
);

const asDateFnsLocale = (locale: unknown): Locale => {
    if (!isDateFnsLocale(locale)) {
        throw new TypeError("Calendar locale objects must implement the date-fns Locale contract.");
    }
    return locale;
};

export const resolveCalendarLocaleName = (
    name = DEFAULT_CALENDAR_LOCALE
): string => {
    if (typeof name !== "string" || name.trim() === "") {
        throw new TypeError("Calendar locale names must be non-empty strings.");
    }

    let locale;
    try {
        locale = new Intl.Locale(name.trim());
    } catch (error) {
        throw new RangeError(`Calendar locale "${name}" is not a valid locale name.`, {
            cause: error
        });
    }

    const languageScript = locale.script
        ? `${locale.language}-${locale.script}`
        : null;
    const languageRegion = locale.region
        ? `${locale.language}-${locale.region}`
        : null;
    const candidates = [
        locale.baseName,
        localeAliases[locale.baseName],
        languageScript && localeAliases[languageScript],
        languageScript,
        languageRegion,
        locale.language,
        localeAliases[locale.language]
    ].filter((candidate): candidate is string => Boolean(candidate));
    const resolvedName = candidates.find((candidate) => directLocaleNames.has(candidate));

    if (!resolvedName) {
        throw new RangeError(`Calendar locale "${name}" is not supported by date-fns.`);
    }
    return resolvedName;
};

const normalizeCalendarLocale = (locale?: CalendarLocale): string | Locale => {
    if (locale == null) return DEFAULT_CALENDAR_LOCALE;
    if (typeof locale === "object") return asDateFnsLocale(locale);
    return resolveCalendarLocaleName(locale);
};

export const getLoadedCalendarLocale = (locale?: CalendarLocale): Locale | undefined => {
    const normalizedLocale = normalizeCalendarLocale(locale);
    return typeof normalizedLocale === "string"
        ? loadedLocales.get(normalizedLocale)
        : normalizedLocale;
};

export const loadCalendarLocale = (
    locale: CalendarLocale = DEFAULT_CALENDAR_LOCALE
): Promise<Locale> => {
    const normalizedLocale = normalizeCalendarLocale(locale);
    if (typeof normalizedLocale !== "string") return Promise.resolve(normalizedLocale);

    const loadedLocale = loadedLocales.get(normalizedLocale);
    if (loadedLocale) return Promise.resolve(loadedLocale);

    const pendingLocale = pendingLocales.get(normalizedLocale);
    if (pendingLocale) return pendingLocale;

    const loader = calendarLocaleLoaders[normalizedLocale];
    if (!loader) {
        throw new RangeError(`Calendar locale "${normalizedLocale}" is not supported by date-fns.`);
    }
    const promise = loader()
        .then(asDateFnsLocale)
        .then((dateFnsLocale) => {
            loadedLocales.set(normalizedLocale, dateFnsLocale);
            pendingLocales.delete(normalizedLocale);
            return dateFnsLocale;
        })
        .catch((error) => {
            pendingLocales.delete(normalizedLocale);
            throw new Error(`Failed to load calendar locale "${normalizedLocale}".`, {
                cause: error
            });
        });
    pendingLocales.set(normalizedLocale, promise);
    return promise;
};

export const preloadCalendarLocale = loadCalendarLocale;

export const resolveCalendarWeekStart = (
    locale: Locale,
    weekStart?: CalendarWeekStart
): CalendarWeekStart => (
    weekStart ?? locale.options?.weekStartsOn ?? 0
);

export const readCalendarLocale = (locale?: CalendarLocale): Locale => {
    const loadedLocale = getLoadedCalendarLocale(locale);
    if (loadedLocale) return loadedLocale;
    // React Suspense uses thrown promises to retry after async data resolves.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw loadCalendarLocale(locale);
};
