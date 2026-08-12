import { format } from "date-fns/format";
import type { AgendaDayHeaderProps } from "./types.js";

/** Renders a locale-aware heading for one agenda day. */
export default function DayHeader({
    day,
    label
}: AgendaDayHeaderProps) {
    return (
        <time dateTime={format(day, "yyyy-MM-dd")}>
            {label}
        </time>
    );
}
