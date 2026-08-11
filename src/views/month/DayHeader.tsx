import { format } from "date-fns/format";
import type { MonthDayHeaderProps } from "./types.js";

/** Renders the locale-aware day number for a month-grid cell. */
export default function DayHeader({ day, locale }: MonthDayHeaderProps) {
    return (
        <time dateTime={format(day, "yyyy-MM-dd")}>
            {format(day, "d", { locale })}
        </time>
    );
}
