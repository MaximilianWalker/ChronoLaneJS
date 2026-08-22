import type { CalendarEvent } from "../../../types.js";
import type {
    TimeGridSlotSizing,
    TimeGridViewProps
} from "../types.js";
import TimeGridView from "../TimeGridView.js";

const DEFAULT_WEEK_COLUMN_MIN_WIDTH = 96;

const resolveWeekSlotSizing = (
    slotSizing: TimeGridSlotSizing | undefined
): TimeGridSlotSizing => {
    if (slotSizing?.width !== undefined || slotSizing?.minWidth !== undefined) {
        return slotSizing;
    }

    return {
        ...slotSizing,
        minWidth: DEFAULT_WEEK_COLUMN_MIN_WIDTH
    } as TimeGridSlotSizing;
};

/**
 * Renders {@link TimeGridView} with the seven-day range preset.
 *
 * Columns remain fluid down to 96px, then scroll horizontally. An explicit
 * `slotSizing.width` or `slotSizing.minWidth` overrides that preset default.
 */
export default function WeekView<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
>({
    range = "week",
    slotSizing,
    viewName = "week",
    ...props
}: TimeGridViewProps<Event, Resource>) {
    return (
        <TimeGridView
            {...props}
            range={range}
            slotSizing={resolveWeekSlotSizing(slotSizing)}
            viewName={viewName}
        />
    );
}
