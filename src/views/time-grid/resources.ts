import type { ReactNode } from "react";

import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../types.js";

/** Safely reads one own or inherited property from an object-like value. */
const getProperty = (value: unknown, property: string): unknown => (
    value && typeof value === "object" && property in value
        ? value[property as keyof typeof value]
        : undefined
);

/**
 * Reads the default stable identifier from `resource.id`.
 *
 * @param resource - Arbitrary resource value.
 * @returns The resource identifier, or `undefined` when unavailable.
 */
export const getDefaultResourceId = (resource: unknown): unknown => (
    getProperty(resource, "id")
);

/**
 * Selects the default display value from `title`, `name`, then `id`.
 *
 * @param resource - Arbitrary resource value.
 * @returns A renderable title, or `null` when no default field exists.
 */
export const getDefaultResourceTitle = (resource: unknown): ReactNode => (
    (getProperty(resource, "title")
        ?? getProperty(resource, "name")
        ?? getProperty(resource, "id")
        ?? null) as ReactNode
);

/**
 * Reads event resource assignments from the built-in conventional fields.
 *
 * Resolution checks `resourceIds`, `resourceId`, then `resource.id`.
 *
 * @param event - Normalized event whose assignments should be read.
 * @returns Zero or more resource identifiers.
 */
export const getDefaultEventResourceIds = (
    event: NormalizedCalendarEvent<CalendarEvent>
): unknown[] => {
    if (Array.isArray(event.resourceIds)) return event.resourceIds;
    if (event.resourceId != null) return [event.resourceId];

    const resourceId = getProperty(event.resource, "id");
    return resourceId == null ? [] : [resourceId];
};
