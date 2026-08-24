import type { CSSProperties } from "react";

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
import type {
    DayHeaderProps,
    ResourceHeaderProps
} from "./types.js";

interface HeaderOccurrenceBase {
    key: string;
    columnIndex: number;
    columnSpan: number;
    className: string;
    style: CSSProperties;
    label: string;
}

export interface DayHeaderOccurrence<Resource> extends HeaderOccurrenceBase {
    kind: "day";
    rendererProps: DayHeaderProps<Resource>;
}

export interface ResourceHeaderOccurrence<Resource> extends HeaderOccurrenceBase {
    kind: "resource";
    rendererProps: ResourceHeaderProps<Resource>;
}

export type HeaderOccurrence<Resource> =
    DayHeaderOccurrence<Resource>
    | ResourceHeaderOccurrence<Resource>;

export interface HeaderModel<Resource> {
    className: string;
    hasResourceHeaders: boolean;
    occurrences: HeaderOccurrence<Resource>[];
    columnLabels: string[];
}

const createOccurrence = <Event extends CalendarEvent, Resource>(
    cell: HeaderCell<Resource>,
    rowIndex: number,
    resources: CalendarResourceConfig<Event, Resource> | undefined,
    text: ViewText
): HeaderOccurrence<Resource> => {
    const columnSpan = cell.columns.length;
    const base = {
        key: `${rowIndex}-${cell.key}`,
        columnIndex: cell.columnIndex,
        columnSpan,
        className: `time-grid-view_header-cell time-grid-view_${cell.kind}-header is-${rowIndex === 0
            ? "primary"
            : "secondary"}`,
        style: {
            gridColumn: `${cell.columnIndex + 2} / span ${columnSpan}`,
            gridRow: rowIndex + 1
        }
    };

    if (cell.kind === "day") {
        const title = text.formatters.dayHeader(cell.day, text.context);
        return {
            ...base,
            kind: "day",
            label: title,
            rendererProps: {
                day: cell.day,
                columns: cell.columns,
                title
            }
        };
    }

    const title = resolveCalendarResourceTitle(
        resources,
        cell.resource,
        cell.resourceId
    );
    return {
        ...base,
        kind: "resource",
        label: typeof title === "string" || typeof title === "number"
            ? String(title)
            : String(cell.resourceId),
        rendererProps: {
            resource: cell.resource,
            resourceId: cell.resourceId,
            columns: cell.columns,
            title
        }
    };
};

export const createHeaderModel = <Event extends CalendarEvent, Resource>(
    columns: LayoutColumn<Resource>[],
    rows: HeaderRows<Resource>,
    resources: CalendarResourceConfig<Event, Resource> | undefined,
    text: ViewText
): HeaderModel<Resource> => {
    const hasResourceHeaders = rows.secondary.length > 0;
    const occurrences = [
        ...rows.primary.map((cell) => createOccurrence(cell, 0, resources, text)),
        ...rows.secondary.map((cell) => createOccurrence(cell, 1, resources, text))
    ];

    return {
        className: `time-grid-view_header${hasResourceHeaders
            ? " has-resource-headers"
            : ""}`,
        hasResourceHeaders,
        occurrences,
        columnLabels: columns.map((_, columnIndex) => occurrences
            .filter((occurrence) => (
                columnIndex >= occurrence.columnIndex
                && columnIndex < occurrence.columnIndex + occurrence.columnSpan
            ))
            .map(({ label }) => label)
            .join(", "))
    };
};
