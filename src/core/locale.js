import { enUS } from "date-fns/locale/en-US";
import { calendarLocaleLoaders } from "./locale-loaders.generated.js";

export const DEFAULT_CALENDAR_LOCALE = "en-US";
export const defaultCalendarLocale = enUS;

const localeAliases = Object.freeze({
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
const loadedLocales = new Map([[DEFAULT_CALENDAR_LOCALE, defaultCalendarLocale]]);
const pendingLocales = new Map();

export const calendarLocaleNames = Object.freeze(Array.from(new Set([
    ...directLocaleNames,
    ...Object.keys(localeAliases)
])).sort());

const isDateFnsLocale = (locale) => Boolean(
    locale
    && typeof locale === "object"
    && typeof locale.code === "string"
    && typeof locale.localize?.month === "function"
    && typeof locale.localize?.day === "function"
    && typeof locale.formatLong?.date === "function"
);

const asDateFnsLocale = (locale) => {
    if (!isDateFnsLocale(locale)) {
        throw new TypeError("Calendar locale objects must implement the date-fns Locale contract.");
    }
    return locale;
};

export const resolveCalendarLocaleName = (name = DEFAULT_CALENDAR_LOCALE) => {
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
    ].filter(Boolean);
    const resolvedName = candidates.find((candidate) => directLocaleNames.has(candidate));

    if (!resolvedName) {
        throw new RangeError(`Calendar locale "${name}" is not supported by date-fns.`);
    }
    return resolvedName;
};

const normalizeCalendarLocale = (locale) => {
    if (locale == null) return DEFAULT_CALENDAR_LOCALE;
    if (typeof locale === "object") return asDateFnsLocale(locale);
    return resolveCalendarLocaleName(locale);
};

export const getLoadedCalendarLocale = (locale) => {
    const normalizedLocale = normalizeCalendarLocale(locale);
    return typeof normalizedLocale === "string"
        ? loadedLocales.get(normalizedLocale)
        : normalizedLocale;
};

export const loadCalendarLocale = (locale = DEFAULT_CALENDAR_LOCALE) => {
    const normalizedLocale = normalizeCalendarLocale(locale);
    if (typeof normalizedLocale !== "string") return Promise.resolve(normalizedLocale);

    const loadedLocale = loadedLocales.get(normalizedLocale);
    if (loadedLocale) return Promise.resolve(loadedLocale);

    const pendingLocale = pendingLocales.get(normalizedLocale);
    if (pendingLocale) return pendingLocale;

    const loader = calendarLocaleLoaders[normalizedLocale];
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

export const resolveCalendarWeekStart = (locale, weekStart) => (
    weekStart ?? locale.options?.weekStartsOn ?? 0
);

export const readCalendarLocale = (locale) => {
    const loadedLocale = getLoadedCalendarLocale(locale);
    if (loadedLocale) return loadedLocale;
    throw loadCalendarLocale(locale);
};
