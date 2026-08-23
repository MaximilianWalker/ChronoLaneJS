import type {
    CalendarEvent,
    CalendarEventId,
    CalendarEventInteractions,
    CalendarEventOccurrence,
    CalendarFormatContext,
    CalendarFormatters,
    CalendarMessages,
    NormalizedCalendarEvent,
    SharedViewProps
} from "../types.js";
import { createEventInteractionProps } from "./eventInteraction.js";
import type { EventInteractionProps } from "./eventInteraction.js";

export interface EventBehavior<
    Event extends CalendarEvent,
    Resource
> {
    selectedIds: CalendarEventId[];
    canSelect?: SharedViewProps<Event, Resource>["canSelectEvent"];
    canOpen?: SharedViewProps<Event, Resource>["canOpenEvent"];
    onSelect?: SharedViewProps<Event, Resource>["onEventSelect"];
    onOpen?: SharedViewProps<Event, Resource>["onEventOpen"];
    interactions?: CalendarEventInteractions<Event, Resource>;
}

export interface ViewText {
    formatters: CalendarFormatters;
    messages: CalendarMessages;
    context: CalendarFormatContext;
}

interface CreateEventPresentationOptions<
    Event extends CalendarEvent,
    Resource
> {
    event: NormalizedCalendarEvent<Event>;
    occurrence: CalendarEventOccurrence<Resource>;
    behavior: EventBehavior<Event, Resource>;
    text: ViewText;
}

export interface EventPresentation {
    selected: boolean;
    interactionProps: EventInteractionProps;
    ariaLabel?: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
}

export const createEventPresentation = <
    Event extends CalendarEvent,
    Resource
>({
    event,
    occurrence,
    behavior,
    text
}: CreateEventPresentationOptions<Event, Resource>): EventPresentation => {
    const interactionProps = createEventInteractionProps({
        event,
        context: {
            view: text.context.view,
            occurrence
        },
        canSelectEvent: behavior.canSelect,
        canOpenEvent: behavior.canOpen,
        onEventSelect: behavior.onSelect,
        onEventOpen: behavior.onOpen,
        eventInteractions: behavior.interactions
    });
    const interactive = interactionProps.onClick != null
        || interactionProps.onDoubleClick != null
        || interactionProps.onContextMenu != null
        || interactionProps.onKeyDown != null;
    const startDate = text.formatters.date(event.start, text.context);
    const startTime = text.formatters.time(event.start, text.context);
    const endDate = text.formatters.date(event.end, text.context);
    const endTime = text.formatters.time(event.end, text.context);

    return {
        selected: event.id != null && behavior.selectedIds.includes(event.id),
        interactionProps,
        ariaLabel: interactive
            ? text.messages.eventLabel({
                view: text.context.view,
                title: event.title,
                description: event.description,
                startDate,
                startTime,
                endDate,
                endTime
            })
            : undefined,
        startDate,
        startTime,
        endDate,
        endTime
    };
};
