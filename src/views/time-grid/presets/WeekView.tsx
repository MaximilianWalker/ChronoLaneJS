import type { CalendarEvent } from "../../../types.js";
import type { TimeGridViewProps } from "../types.js";
import TimeGridView from "../TimeGridView.js";

/**
 * Renders {@link TimeGridView} with seven-day range and navigation defaults.
 *
 * Any supplied time-grid prop overrides the preset default.
 */
export default function WeekView<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
>({
    range = "week",
    navigationStep = 7,
    viewName = "week",
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
