import type { CalendarEvent, TimeGridViewProps } from "../../../types.js";
import TimeGridView from "../TimeGridView.js";

export default function DayView<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
>({
    range = "day",
    navigationStep = 1,
    dayFormat = "EEEE, MMMM do",
    headerFormat = "MMMM do, yyyy",
    previousLabel = "Previous day",
    nextLabel = "Next day",
    ...props
}: TimeGridViewProps<Event, Resource>) {
    return (
        <TimeGridView
            {...props}
            range={range}
            navigationStep={navigationStep}
            dayFormat={dayFormat}
            headerFormat={headerFormat}
            previousLabel={previousLabel}
            nextLabel={nextLabel}
        />
    );
}
