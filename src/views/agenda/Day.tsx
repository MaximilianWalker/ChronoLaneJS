import type { ComponentType } from "react";

import type {
    EventBehavior,
    ViewText
} from "../../components/eventPresentation.js";
import type { CalendarEvent } from "../../types.js";
import type { DayGroup } from "./layout.js";
import Occurrence from "./Occurrence.js";
import type {
    DayHeaderProps,
    EventProps
} from "./types.js";

interface DayProps<Event extends CalendarEvent> {
    group: DayGroup<Event>;
    eventRenderer: ComponentType<EventProps<Event>>;
    headerRenderer: ComponentType<DayHeaderProps>;
    behavior: EventBehavior<Event, never>;
    text: ViewText;
}

export default function Day<Event extends CalendarEvent>({
    group,
    eventRenderer,
    headerRenderer: DayHeaderRenderer,
    behavior,
    text
}: DayProps<Event>) {
    return (
        <section className="agenda-view_day">
            <h3 className="agenda-view_day-heading">
                <DayHeaderRenderer
                    day={group.day}
                    label={text.formatters.dayHeader(group.day, text.context)}
                />
            </h3>
            <div className="agenda-view_day-events">
                {group.events.map(({ key, event }) => (
                    <Occurrence
                        key={key}
                        event={event}
                        day={group.day}
                        renderer={eventRenderer}
                        behavior={behavior}
                        text={text}
                    />
                ))}
            </div>
        </section>
    );
}
