import { format } from "date-fns/format";
import type { TimeGridDayHeaderProps } from "./types.js";

/** Renders the prepared label for one visible day header group. */
export default function DayHeader<Resource>({
    day,
    title
}: TimeGridDayHeaderProps<Resource>) {
    return <time dateTime={format(day, "yyyy-MM-dd")}>{title}</time>;
}
