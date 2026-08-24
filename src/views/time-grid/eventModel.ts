import type { ComponentType } from "react";

import { createEventPresentation } from "../../components/eventPresentation.js";
import type {
    EventBehavior,
    ViewText
} from "../../components/eventPresentation.js";
import type { EventInteractionProps } from "../../components/eventInteraction.js";
import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../types.js";
import { toEventSegment } from "./contracts.js";
import type {
    EventProps,
    EventSegment,
    MultiDayEventLayout,
    ViewProps
} from "./types.js";
import { isMultiDayEvent } from "./layout/multiDayEvents.js";

interface EventPartition<Event extends CalendarEvent> {
    timedEvents: NormalizedCalendarEvent<Event>[];
    dedicatedEvents: NormalizedCalendarEvent<Event>[];
}

export const partitionEvents = <Event extends CalendarEvent>(
    events: NormalizedCalendarEvent<Event>[],
    layout: MultiDayEventLayout
): EventPartition<Event> => {
    if (layout !== "timed" && layout !== "dedicated") {
        throw new TypeError(
            'multiDayEventLayout must be either "timed" or "dedicated".'
        );
    }

    if (layout === "timed") {
        return { timedEvents: events, dedicatedEvents: [] };
    }

    return {
        timedEvents: events.filter((event) => !isMultiDayEvent(event)),
        dedicatedEvents: events.filter(isMultiDayEvent)
    };
};

export interface EventRendering<
    Event extends CalendarEvent,
    Resource
> {
    eventRenderer: ComponentType<EventProps<Event, Resource>>;
    getEventKey: (event: NormalizedCalendarEvent<Event>) => string;
    behavior: EventBehavior<Event, Resource>;
    text: ViewText;
    moveEnabled: boolean;
    resizeEnabled: boolean;
    canDrag?: ViewProps<Event, Resource>["canDragEvent"];
    canResize?: ViewProps<Event, Resource>["canResizeEvent"];
}

interface CreateEventModelOptions<
    Event extends CalendarEvent,
    Resource
> {
    event: NormalizedCalendarEvent<Event>;
    segment: Omit<EventSegment<Resource>, "layout">;
    layout?: MultiDayEventLayout;
    rendering: EventRendering<Event, Resource>;
}

interface EventModel<Resource> {
    segment: EventSegment<Resource>;
    selected: boolean;
    movable: boolean;
    interactionProps: EventInteractionProps;
    details: string;
    ariaLabel?: string;
}

export const createEventModel = <Event extends CalendarEvent, Resource>({
    event,
    segment,
    layout = "timed",
    rendering
}: CreateEventModelOptions<Event, Resource>): EventModel<Resource> => {
    const rendererSegment = toEventSegment(segment, layout);
    const presentation = createEventPresentation({
        event,
        occurrence: {
            day: segment.day,
            resource: segment.resource,
            resourceId: segment.resourceId
        },
        behavior: rendering.behavior,
        text: rendering.text
    });

    return {
        segment: rendererSegment,
        selected: presentation.selected,
        movable: rendering.moveEnabled
            && (rendering.canDrag?.(event, rendererSegment) ?? true),
        interactionProps: presentation.interactionProps,
        details: presentation.details,
        ariaLabel: presentation.ariaLabel
    };
};
