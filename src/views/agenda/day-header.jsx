import { format } from "date-fns";

export default function AgendaDayHeader({ day, locale, format: dayFormat }) {
    return (
        <time dateTime={format(day, "yyyy-MM-dd")}>
            {format(day, dayFormat, { locale })}
        </time>
    );
}
