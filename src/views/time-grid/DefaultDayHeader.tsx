import { format } from "date-fns/format";
import type { DayHeaderProps } from "./types.js";

/** Renders the prepared label for one visible day header group. */
export default function DefaultDayHeader<Resource>({
    day,
    title
}: DayHeaderProps<Resource>) {
    return <time dateTime={format(day, "yyyy-MM-dd")}>{title}</time>;
}
