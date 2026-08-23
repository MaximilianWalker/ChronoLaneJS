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

export interface EventRendering<
    Event extends CalendarEvent,
    Resource
> {
    renderer: ComponentType<EventProps<Event, Resource>>;
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

export interface EventModel<Resource> {
    segment: EventSegment<Resource>;
    selected: boolean;
    movable: boolean;
    interactionProps: EventInteractionProps;
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
        ariaLabel: presentation.ariaLabel
    };
};
