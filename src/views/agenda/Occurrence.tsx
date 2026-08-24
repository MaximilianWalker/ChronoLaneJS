import type { ComponentType } from "react";

import { createEventPresentation } from "../../components/eventPresentation.js";
import type {
    EventBehavior,
    ViewText
} from "../../components/eventPresentation.js";
import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../types.js";
import type { EventProps } from "./types.js";

interface OccurrenceProps<Event extends CalendarEvent> {
    event: NormalizedCalendarEvent<Event>;
    day: Date;
    eventRenderer: ComponentType<EventProps<Event>>;
    behavior: EventBehavior<Event, never>;
    text: ViewText;
}

export default function Occurrence<Event extends CalendarEvent>({
    event,
    day,
    eventRenderer: EventRenderer,
    behavior,
    text
}: OccurrenceProps<Event>) {
    const presentation = createEventPresentation({
        event,
        occurrence: {
            day,
            resource: null,
            resourceId: null
        },
        behavior,
        text
    });

    return (
        <EventRenderer
            event={event}
            timeLabel={text.messages.timeRange({
                view: text.context.view,
                startTime: presentation.startTime,
                endTime: presentation.endTime
            })}
            selected={presentation.selected}
            elementProps={{
                className: "agenda-view_event",
                ...presentation.interactionProps,
                "aria-label": presentation.ariaLabel,
                title: presentation.details,
                style: { "--color": event.color }
            }}
        />
    );
}
