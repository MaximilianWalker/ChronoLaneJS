import { format } from "date-fns/format";
import type { DayHeaderProps } from "./types.js";

/** Renders the prepared day label for a month-grid cell. */
export default function DefaultDayHeader({ day, label }: DayHeaderProps) {
    return (
        <time dateTime={format(day, "yyyy-MM-dd")}>
            {label}
        </time>
    );
}
