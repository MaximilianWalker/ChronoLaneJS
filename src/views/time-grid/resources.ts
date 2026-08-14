import type { ReactNode } from "react";

import type {
    CalendarEvent,
    CalendarResourceConfig,
    CalendarResourceId,
    NormalizedCalendarEvent
} from "../../types.js";

export interface ResolvedCalendarResource<Resource> {
    id: CalendarResourceId;
    item: Resource;
}

const getProperty = (value: unknown, property: string): unknown => (
    value && typeof value === "object" && property in value
        ? value[property as keyof typeof value]
        : undefined
);

const isCalendarResourceId = (value: unknown): value is CalendarResourceId => (
    (typeof value === "string" && value.length > 0)
    || (typeof value === "number" && Number.isFinite(value))
);

const describeResourceId = (id: CalendarResourceId): string => (
    `${typeof id} ${JSON.stringify(id)}`
);

const assertCalendarResourceId: (
    value: unknown,
    context: string
) => asserts value is CalendarResourceId = (value, context) => {
    if (!isCalendarResourceId(value)) {
        throw new TypeError(
            `${context} must be a non-empty string or finite number.`
        );
    }
};

const getDefaultResourceId = (
    resource: unknown
): CalendarResourceId | undefined => {
    const id = getProperty(resource, "id");
    return isCalendarResourceId(id) ? id : undefined;
};

const getDefaultResourceTitle = (resource: unknown): ReactNode => (
    (getProperty(resource, "title")
        ?? getProperty(resource, "name")
        ?? getProperty(resource, "id")
        ?? null) as ReactNode
);

const getDefaultEventResourceIds = <Event extends CalendarEvent>(
    event: NormalizedCalendarEvent<Event>
): CalendarResourceId[] => {
    if (Array.isArray(event.resourceIds)) return event.resourceIds;
    if (event.resourceId != null) return [event.resourceId];

    const resourceId = getProperty(event.resource, "id");
    if (resourceId == null) return [];

    assertCalendarResourceId(resourceId, "Calendar event resource ID");
    return [resourceId];
};

/** Resolves and validates the unique identifiers for configured resources. */
export const resolveCalendarResources = <Event extends CalendarEvent, Resource>(
    resources?: CalendarResourceConfig<Event, Resource>
): ResolvedCalendarResource<Resource>[] => {
    if (!resources) return [];

    const getId = resources.getId ?? getDefaultResourceId;
    const indexesById = new Map<CalendarResourceId, number>();

    return resources.items.map((item, index) => {
        const id = getId(item);
        assertCalendarResourceId(id, `Calendar resource at index ${index} ID`);

        const duplicateIndex = indexesById.get(id);
        if (duplicateIndex != null) {
            throw new RangeError(
                `Calendar resource ID ${describeResourceId(id)} is duplicated at indexes ${duplicateIndex} and ${index}.`
            );
        }
        indexesById.set(id, index);

        return { id, item };
    });
};

/** Resolves unique, validated resource assignments for one event. */
export const resolveCalendarEventResourceIds = <Event extends CalendarEvent>(
    event: NormalizedCalendarEvent<Event>,
    getEventIds?: (
        event: NormalizedCalendarEvent<Event>
    ) => CalendarResourceId[]
): Set<CalendarResourceId> => {
    const ids = (getEventIds ?? getDefaultEventResourceIds)(event);
    if (!Array.isArray(ids)) {
        throw new TypeError("Calendar event resource IDs must be an array.");
    }

    return new Set(ids.map((id, index) => {
        assertCalendarResourceId(id, `Calendar event resource ID at index ${index}`);
        return id;
    }));
};

/** Resolves a configured resource title with conventional field fallbacks. */
export const resolveCalendarResourceTitle = <Event extends CalendarEvent, Resource>(
    resources: CalendarResourceConfig<Event, Resource> | undefined,
    resource: Resource,
    resourceId: CalendarResourceId
): ReactNode => (
    resources?.getTitle
        ? resources.getTitle(resource)
        : getDefaultResourceTitle(resource) ?? resourceId
);
