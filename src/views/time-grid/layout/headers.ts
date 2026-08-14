import type { CalendarResourceId } from "../../../types.js";
import type {
    TimeGridColumn,
    TimeGridGroupBy
} from "../types.js";

interface TimeGridHeaderCellBase<Resource> {
    key: string;
    columnIndex: number;
    columns: TimeGridColumn<Resource>[];
}

export interface TimeGridDayHeaderCell<Resource = unknown>
    extends TimeGridHeaderCellBase<Resource> {
    kind: "day";
    day: Date;
    dayIndex: number;
}

export interface TimeGridResourceHeaderCell<Resource = unknown>
    extends TimeGridHeaderCellBase<Resource> {
    kind: "resource";
    resource: Resource;
    resourceId: CalendarResourceId;
    resourceIndex: number;
}

export type TimeGridHeaderCell<Resource = unknown> =
    TimeGridDayHeaderCell<Resource>
    | TimeGridResourceHeaderCell<Resource>;

export interface TimeGridHeaderRows<Resource = unknown> {
    primary: TimeGridHeaderCell<Resource>[];
    secondary: TimeGridHeaderCell<Resource>[];
}

interface ColumnGroup<Resource> {
    columnIndex: number;
    columns: TimeGridColumn<Resource>[];
}

/** Groups adjacent columns that share the selected outer dimension. */
const groupColumns = <Resource>(
    columns: TimeGridColumn<Resource>[],
    belongsToGroup: (
        first: TimeGridColumn<Resource>,
        next: TimeGridColumn<Resource>
    ) => boolean
): ColumnGroup<Resource>[] => {
    const groups: ColumnGroup<Resource>[] = [];

    columns.forEach((column, columnIndex) => {
        const current = groups.at(-1);
        const first = current?.columns[0];
        if (current && first && belongsToGroup(first, column)) {
            current.columns.push(column);
            return;
        }

        groups.push({ columnIndex, columns: [column] });
    });

    return groups;
};

/** Creates a day header cell from one contiguous group of columns. */
const createDayCell = <Resource>({
    columnIndex,
    columns
}: ColumnGroup<Resource>): TimeGridDayHeaderCell<Resource> => {
    const column = columns[0];
    if (!column) throw new RangeError("A day header requires at least one column.");

    return {
        kind: "day",
        key: `day-${column.day.getTime()}-${columnIndex}`,
        columnIndex,
        columns,
        day: column.day,
        dayIndex: column.dayIndex
    };
};

/** Creates a resource header cell from one contiguous group of columns. */
const createResourceCell = <Resource>({
    columnIndex,
    columns
}: ColumnGroup<Resource>): TimeGridResourceHeaderCell<Resource> => {
    const column = columns[0];
    if (
        !column
        || column.resourceId == null
        || column.resourceIndex == null
    ) {
        throw new RangeError("A resource header requires a resource column.");
    }

    return {
        kind: "resource",
        key: `resource-${typeof column.resourceId}-${column.resourceId}-${columnIndex}`,
        columnIndex,
        columns,
        resource: column.resource as Resource,
        resourceId: column.resourceId,
        resourceIndex: column.resourceIndex
    };
};

/** Builds hierarchical header rows aligned with the ordered grid columns. */
export const createTimeGridHeaderRows = <Resource>(
    columns: TimeGridColumn<Resource>[],
    groupBy: TimeGridGroupBy
): TimeGridHeaderRows<Resource> => {
    const hasResources = columns.some(({ resourceId }) => resourceId != null);
    if (!hasResources) {
        return {
            primary: columns.map((column, columnIndex) => createDayCell({
                columnIndex,
                columns: [column]
            })),
            secondary: []
        };
    }

    const individualColumns = columns.map((column, columnIndex) => ({
        columnIndex,
        columns: [column]
    }));
    if (groupBy === "day") {
        return {
            primary: groupColumns(
                columns,
                (first, next) => first.dayIndex === next.dayIndex
            ).map(createDayCell),
            secondary: individualColumns.map(createResourceCell)
        };
    }

    return {
        primary: groupColumns(
            columns,
            (first, next) => first.resourceIndex === next.resourceIndex
        ).map(createResourceCell),
        secondary: individualColumns.map(createDayCell)
    };
};
