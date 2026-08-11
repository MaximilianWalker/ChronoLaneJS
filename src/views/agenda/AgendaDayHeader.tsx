import { format } from "date-fns";
import type { AgendaDayHeaderProps } from "../../types.js";

export default function AgendaDayHeader({
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
