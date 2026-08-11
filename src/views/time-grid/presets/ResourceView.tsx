import type { CalendarEvent } from "../../../types.js";
import type { TimeGridViewProps } from "../types.js";
import TimeGridView from "../TimeGridView.js";

export default function ResourceView<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
>({
    range = "day",
    navigationStep = 1,
    previousLabel = "Previous resource range",
    nextLabel = "Next resource range",
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
