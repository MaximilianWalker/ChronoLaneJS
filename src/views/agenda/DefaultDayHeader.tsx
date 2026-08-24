import { format } from "date-fns/format";
import type { DayHeaderProps } from "./types.js";

/** Renders a locale-aware heading for one agenda day. */
export default function DefaultDayHeader({
    day,
    label
}: DayHeaderProps) {
    return (
        <time dateTime={format(day, "yyyy-MM-dd")}>
            {label}
        </time>
    );
}
