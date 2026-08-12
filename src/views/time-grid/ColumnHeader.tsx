import { format } from "date-fns/format";
import type { TimeGridColumnHeaderProps } from "./types.js";

/** Renders a locale-aware day label and optional resource title for a column. */
export default function ColumnHeader<Resource>({
    column,
    title,
    resourceTitle
}: TimeGridColumnHeaderProps<Resource>) {
    return (
        <>
            <time dateTime={format(column.day, "yyyy-MM-dd")}>
                {title}
            </time>
            {resourceTitle != null && (
                <span className="time-grid-view_resource-title">{resourceTitle}</span>
            )}
        </>
    );
}
