import { format } from "date-fns";

export default function TimeGridColumnHeader({
    column,
    locale,
    dayFormat,
    resourceTitle
}) {
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
