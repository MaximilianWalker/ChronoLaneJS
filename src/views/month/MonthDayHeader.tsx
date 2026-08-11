import { format } from "date-fns";
import type { MonthDayHeaderProps } from "../../types.js";

export default function MonthDayHeader({ day, locale }: MonthDayHeaderProps) {
    return (
        <time dateTime={format(day, "yyyy-MM-dd")}>
            {format(day, "d", { locale })}
        </time>
    );
}
