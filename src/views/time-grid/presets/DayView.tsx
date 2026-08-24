import type { CalendarEvent } from "../../../types.js";
import type { ViewProps } from "../types.js";
import View from "../View.js";

/**
 * Renders {@link TimeGridView} with the one-day range preset.
 *
 * Any supplied time-grid prop overrides the preset default.
 */
export default function DayView<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
>({
    range = "day",
    viewName = "day",
    ...props
}: ViewProps<Event, Resource>) {
    return (
        <View
            {...props}
            range={range}
            viewName={viewName}
        />
    );
}
