import { enUS } from "date-fns/locale/en-US";
import type { Locale } from "date-fns";

import {
    calendarLocaleLoaderNames,
    calendarLocaleLoaders
} from "./localeLoaders.generated.js";
import type { CalendarLocale, CalendarWeekStart } from "../types.js";

/** The BCP 47 name of the synchronously available default locale. */
export const DEFAULT_CALENDAR_LOCALE = "en-US";

/** The date-fns locale object used before any lazy locale is requested. */
export const defaultCalendarLocale = enUS;

const localeAliases: Readonly<Record<string, string>> = /* @__PURE__ */ Object.freeze({
    en: "en-US",
    "pt-PT": "pt",
    zh: "zh-CN",
    "zh-Hans": "zh-CN",
    "zh-Hant": "zh-TW"
});
const directLocaleNames = /* @__PURE__ */ (() => new Set([
    DEFAULT_CALENDAR_LOCALE,
    ...calendarLocaleLoaderNames
]))();
const loadedLocales = new Map<string, Locale>([
    [DEFAULT_CALENDAR_LOCALE, defaultCalendarLocale]
]);
const pendingLocales = new Map<string, Promise<Locale>>();

/** All locale names accepted by the built-in date-fns locale registry. */
export const calendarLocaleNames = /* @__PURE__ */ (() => Object.freeze(
    Array.from(new Set([
        ...directLocaleNames,
        ...Object.keys(localeAliases)
    ])).sort()
))();

/** Determines whether a value implements the date-fns `Locale` contract used here. */
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

/**
 * Validates and narrows an unknown value to a date-fns locale.
 *
 * @throws TypeError if the value does not implement the required locale contract.
 */
const asDateFnsLocale = (locale: unknown): Locale => {
    if (!isDateFnsLocale(locale)) {
        throw new TypeError("Calendar locale objects must implement the date-fns Locale contract.");
    }
    return locale;
};

export const loadCalendarLocaleModule = async (
    name: string,
    loader: () => Promise<unknown>
): Promise<Locale> => {
    try {
        return asDateFnsLocale(await loader());
    } catch (error) {
        throw new Error(`Failed to load calendar locale "${name}".`, {
            cause: error
        });
    }
};

/**
 * Resolves a BCP 47-style locale name to a registered date-fns locale module.
 *
 * Resolution tries the canonical base name, configured aliases, script and
 * region variants, and finally the base language.
 *
 * @param name - Locale name to canonicalize and resolve.
 * @returns The key used by the locale loader registry.
 * @throws TypeError if `name` is empty or not a string.
 * @throws RangeError if `name` is invalid or unsupported by the registry.
 */
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

/** Resolves a locale input to either a registry key or a validated locale object. */
const normalizeCalendarLocale = (locale?: CalendarLocale): string | Locale => {
    if (locale == null) return DEFAULT_CALENDAR_LOCALE;
    if (typeof locale === "object") return asDateFnsLocale(locale);
    return resolveCalendarLocaleName(locale);
};

/**
 * Reads a locale only when it is already available synchronously.
 *
 * @param locale - Locale object or supported locale name. Defaults to `en-US`.
 * @returns The locale object, or `undefined` when a named locale is not loaded.
 */
export const getLoadedCalendarLocale = (locale?: CalendarLocale): Locale | undefined => {
    const normalizedLocale = normalizeCalendarLocale(locale);
    return typeof normalizedLocale === "string"
        ? loadedLocales.get(normalizedLocale)
        : normalizedLocale;
};

/**
 * Loads and caches a date-fns locale.
 *
 * Concurrent requests for the same locale share one promise. Passing a locale
 * object resolves immediately without using the registry.
 *
 * @param locale - Locale object or supported BCP 47-style name.
 * @returns A promise for the validated date-fns locale.
 * @throws TypeError if a locale object or name is malformed.
 * @throws RangeError if the locale name is invalid or unsupported.
 */
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
    const promise = loadCalendarLocaleModule(normalizedLocale, loader)
        .then((dateFnsLocale) => {
            loadedLocales.set(normalizedLocale, dateFnsLocale);
            return dateFnsLocale;
        })
        .finally(() => {
            pendingLocales.delete(normalizedLocale);
        });
    pendingLocales.set(normalizedLocale, promise);
    return promise;
};

/**
 * Preloads a locale into the shared cache before a component attempts to read it.
 *
 * @see {@link loadCalendarLocale}
 */
export const preloadCalendarLocale = loadCalendarLocale;

/**
 * Selects the first weekday from an explicit override or locale convention.
 *
 * @param locale - date-fns locale supplying the regional default.
 * @param weekStart - Optional explicit weekday index, where Sunday is `0`.
 * @returns A weekday index from `0` through `6`.
 */
export const resolveCalendarWeekStart = (
    locale: Locale,
    weekStart?: CalendarWeekStart
): CalendarWeekStart => (
    weekStart ?? locale.options?.weekStartsOn ?? 0
);

/**
 * Reads a locale during render, suspending while a named locale loads.
 *
 * @remarks
 * When the locale is not cached, this function throws its loading promise so a
 * surrounding React `Suspense` boundary can retry the render.
 *
 * @param locale - Locale object or supported locale name.
 * @returns A synchronously available date-fns locale.
 */
export const readCalendarLocale = (locale?: CalendarLocale): Locale => {
    const loadedLocale = getLoadedCalendarLocale(locale);
    if (loadedLocale) return loadedLocale;
    // React Suspense uses thrown promises to retry after async data resolves.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw loadCalendarLocale(locale);
};
