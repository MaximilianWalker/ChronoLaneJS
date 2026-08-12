import type { CalendarEvent } from "../../../types.js";
import type { TimeGridViewProps } from "../types.js";
import TimeGridView from "../TimeGridView.js";

/**
 * Renders {@link TimeGridView} with one-day range and navigation defaults.
 *
 * Any supplied time-grid prop overrides the preset default.
 */
export default function DayView<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
>({
    range = "day",
    navigationStep = 1,
    viewName = "day",
    ...props
}: TimeGridViewProps<Event, Resource>) {
    return (
        <TimeGridView
            {...props}
            range={range}
            navigationStep={navigationStep}
            viewName={viewName}
        />
    );
}
