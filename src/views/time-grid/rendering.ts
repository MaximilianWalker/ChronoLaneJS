import type { ComponentType } from "react";

import { createEventInteractionProps } from "../../components/eventInteraction.js";
import type { EventInteractionProps } from "../../components/eventInteraction.js";
import type {
    CalendarEvent,
    CalendarEventId,
    CalendarFormatContext,
    CalendarFormatters,
    CalendarMessages,
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
    selectedIds: CalendarEventId[];
    moveEnabled: boolean;
    resizeEnabled: boolean;
    canDrag?: ViewProps<Event, Resource>["canDragEvent"];
    canResize?: ViewProps<Event, Resource>["canResizeEvent"];
    canSelect?: ViewProps<Event, Resource>["canSelectEvent"];
    canOpen?: ViewProps<Event, Resource>["canOpenEvent"];
    onSelect?: ViewProps<Event, Resource>["onEventSelect"];
    onOpen?: ViewProps<Event, Resource>["onEventOpen"];
    interactions?: ViewProps<Event, Resource>["eventInteractions"];
    formatters: CalendarFormatters;
    messages: CalendarMessages;
    formatContext: CalendarFormatContext;
    viewName: string;
}

interface CreateEventPresentationOptions<
    Event extends CalendarEvent,
    Resource
> {
    event: NormalizedCalendarEvent<Event>;
    segment: Omit<EventSegment<Resource>, "layout">;
    layout?: MultiDayEventLayout;
    rendering: EventRendering<Event, Resource>;
}

export interface EventPresentation<Resource> {
    segment: EventSegment<Resource>;
    selected: boolean;
    movable: boolean;
    interactionProps: EventInteractionProps;
    ariaLabel?: string;
}

export const createEventPresentation = <Event extends CalendarEvent, Resource>({
    event,
    segment,
    layout = "timed",
    rendering
}: CreateEventPresentationOptions<Event, Resource>): EventPresentation<Resource> => {
    const rendererSegment = toEventSegment(segment, layout);
    const interactionProps = createEventInteractionProps({
        event,
        context: {
            view: rendering.viewName,
            occurrence: {
                day: segment.day,
                resource: segment.resource,
                resourceId: segment.resourceId
            }
        },
        canSelectEvent: rendering.canSelect,
        canOpenEvent: rendering.canOpen,
        onEventSelect: rendering.onSelect,
        onEventOpen: rendering.onOpen,
        eventInteractions: rendering.interactions
    });
    const interactive = interactionProps.onClick != null
        || interactionProps.onDoubleClick != null
        || interactionProps.onContextMenu != null
        || interactionProps.onKeyDown != null;

    return {
        segment: rendererSegment,
        selected: event.id != null && rendering.selectedIds.includes(event.id),
        movable: rendering.moveEnabled
            && (rendering.canDrag?.(event, rendererSegment) ?? true),
        interactionProps,
        ariaLabel: interactive
            ? rendering.messages.eventLabel({
                view: rendering.viewName,
                title: event.title,
                description: event.description,
                startDate: rendering.formatters.date(
                    event.start,
                    rendering.formatContext
                ),
                startTime: rendering.formatters.time(
                    event.start,
                    rendering.formatContext
                ),
                endDate: rendering.formatters.date(
                    event.end,
                    rendering.formatContext
                ),
                endTime: rendering.formatters.time(
                    event.end,
                    rendering.formatContext
                )
            })
            : undefined
    };
};
