import type { ViewText } from "../../components/eventPresentation.js";
import type {
    CalendarEvent,
    CalendarResourceConfig
} from "../../types.js";
import type {
    HeaderCell,
    HeaderRows
} from "./layout/headers.js";
import type { LayoutColumn } from "./layout/types.js";
import { resolveCalendarResourceTitle } from "./resources.js";

const getCellTitle = <Event extends CalendarEvent, Resource>(
    cell: HeaderCell<Resource>,
    resources: CalendarResourceConfig<Event, Resource> | undefined,
    text: ViewText
): string => {
    if (cell.kind === "day") {
        return text.formatters.dayHeader(cell.day, text.context);
    }

    const title = resolveCalendarResourceTitle(
        resources,
        cell.resource,
        cell.resourceId
    );
    return typeof title === "string" || typeof title === "number"
        ? String(title)
        : String(cell.resourceId);
};

export const createColumnLabels = <
    Event extends CalendarEvent,
    Resource
>(
    columns: LayoutColumn<Resource>[],
    rows: HeaderRows<Resource>,
    resources: CalendarResourceConfig<Event, Resource> | undefined,
    text: ViewText
): string[] => columns.map((_, columnIndex) => (
    [rows.primary, rows.secondary]
        .flat()
        .filter((cell) => (
            columnIndex >= cell.columnIndex
            && columnIndex < cell.columnIndex + cell.columns.length
        ))
        .map((cell) => getCellTitle(cell, resources, text))
        .join(", ")
));
