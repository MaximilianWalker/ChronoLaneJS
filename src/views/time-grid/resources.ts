import type { ReactNode } from "react";

import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../types.js";

const getProperty = (value: unknown, property: string): unknown => (
    value && typeof value === "object" && property in value
        ? value[property as keyof typeof value]
        : undefined
);

export const getDefaultResourceId = (resource: unknown): unknown => (
    getProperty(resource, "id")
);

export const getDefaultResourceTitle = (resource: unknown): ReactNode => (
    (getProperty(resource, "title")
        ?? getProperty(resource, "name")
        ?? getProperty(resource, "id")
        ?? null) as ReactNode
);

export const getDefaultEventResourceIds = (
    event: NormalizedCalendarEvent<CalendarEvent>
): unknown[] => {
    if (Array.isArray(event.resourceIds)) return event.resourceIds;
    if (event.resourceId != null) return [event.resourceId];

    const resourceId = getProperty(event.resource, "id");
    return resourceId == null ? [] : [resourceId];
};
