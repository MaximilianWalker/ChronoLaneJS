import { format } from "date-fns/format";
import type { AgendaDayHeaderProps } from "./types.js";

/** Renders a locale-aware heading for one agenda day. */
export default function DayHeader({
    day,
    locale,
    format: dayFormat
}: AgendaDayHeaderProps) {
    return (
        <time dateTime={format(day, "yyyy-MM-dd")}>
            {format(day, dayFormat, { locale })}
        </time>
    );
}
