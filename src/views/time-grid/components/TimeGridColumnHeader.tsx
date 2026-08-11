import { format } from "date-fns";
import type { TimeGridColumnHeaderProps } from "../../../types.js";

export default function TimeGridColumnHeader<Resource>({
    column,
    locale,
    dayFormat,
    resourceTitle
}: TimeGridColumnHeaderProps<Resource>) {
    return (
        <>
            <time dateTime={format(column.day, "yyyy-MM-dd")}>
                {format(column.day, dayFormat, { locale })}
            </time>
            {resourceTitle != null && (
                <span className="time-grid-view_resource-title">{resourceTitle}</span>
            )}
        </>
    );
}
