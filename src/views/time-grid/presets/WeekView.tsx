import type { CalendarEvent } from "../../../types.js";
import type { TimeGridViewProps } from "../types.js";
import TimeGridView from "../TimeGridView.js";

export default function WeekView<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
>({
    range = "week",
    navigationStep = 7,
    previousLabel = "Previous week",
    nextLabel = "Next week",
    ...props
}: TimeGridViewProps<Event, Resource>) {
    return (
        <TimeGridView
            {...props}
            range={range}
            navigationStep={navigationStep}
            previousLabel={previousLabel}
            nextLabel={nextLabel}
        />
    );
}
