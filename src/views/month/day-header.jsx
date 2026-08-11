import { format } from "date-fns";

export default function MonthDayHeader({ day, locale }) {
    return (
        <time dateTime={format(day, "yyyy-MM-dd")}>
            {format(day, "d", { locale })}
        </time>
    );
}
