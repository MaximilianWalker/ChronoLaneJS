import { format } from "date-fns/format";
import type { MonthDayHeaderProps } from "./types.js";

export default function DayHeader({ day, locale }: MonthDayHeaderProps) {
    return (
        <time dateTime={format(day, "yyyy-MM-dd")}>
            {format(day, "d", { locale })}
        </time>
    );
}
