import type { CalendarEvent } from "../../../types.js";
import type {
    SlotSizing,
    ViewProps
} from "../types.js";
import View from "../View.js";

const DEFAULT_WEEK_COLUMN_MIN_WIDTH = 96;

const resolveWeekSlotSizing = (
    slotSizing: SlotSizing | undefined
): SlotSizing => {
    if (slotSizing?.width !== undefined || slotSizing?.minWidth !== undefined) {
        return slotSizing;
    }

    return {
        ...slotSizing,
        minWidth: DEFAULT_WEEK_COLUMN_MIN_WIDTH
    } as SlotSizing;
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
}: ViewProps<Event, Resource>) {
    return (
        <View
            {...props}
            range={range}
            slotSizing={resolveWeekSlotSizing(slotSizing)}
            viewName={viewName}
        />
    );
}
