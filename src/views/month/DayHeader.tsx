import { format } from "date-fns/format";
import type { MonthDayHeaderProps } from "./types.js";

/** Renders the prepared day label for a month-grid cell. */
export default function DayHeader({ day, label }: MonthDayHeaderProps) {
    return (
        <time dateTime={format(day, "yyyy-MM-dd")}>
            {label}
        </time>
    );
}
