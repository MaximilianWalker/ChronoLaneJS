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
    renderer: ComponentType<EventProps<Event>>;
    behavior: EventBehavior<Event, never>;
    text: ViewText;
}

export default function Occurrence<Event extends CalendarEvent>({
    event,
    day,
    renderer: EventRenderer,
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
            day={day}
            timeLabel={presentation.startTime}
            selected={presentation.selected}
            elementProps={{
                className: "month-view_event",
                ...presentation.interactionProps,
                "aria-label": presentation.ariaLabel,
                style: { "--color": event.color }
            }}
        />
    );
}
