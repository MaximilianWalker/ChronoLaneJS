import type { CalendarResourceId } from "../../types.js";
import {
    atDayMinute,
    getGridRows
} from "./layout/timeScale.js";
import type { ResolvedTimeWindow } from "./layout/timeScale.js";
import type { LayoutColumn } from "./layout/types.js";

export interface TimeGridEventPreviewSegment {
    columnIndex: number;
    startRow: number;
    endRow: number;
}

interface CreateTimeGridEventPreviewSegmentsOptions<Resource> {
    start: Date;
    end: Date;
    resourceId: CalendarResourceId | null;
    columns: LayoutColumn<Resource>[];
    timeWindow: ResolvedTimeWindow;
}

/** Projects a complete event proposal into its overlapping visible columns. */
export const createTimeGridEventPreviewSegments = <Resource>({
    start,
    end,
    resourceId,
    columns,
    timeWindow
}: CreateTimeGridEventPreviewSegmentsOptions<Resource>): TimeGridEventPreviewSegment[] => (
    columns.flatMap((column, columnIndex) => {
        if (column.resourceId !== resourceId) return [];

        const windowStart = atDayMinute(column.day, timeWindow.startMinute);
        const windowEnd = atDayMinute(column.day, timeWindow.endMinute);
        const segmentStart = start > windowStart ? start : windowStart;
        const segmentEnd = end < windowEnd ? end : windowEnd;
        if (segmentStart >= segmentEnd) return [];

        const { startRow, endRow } = getGridRows(
            segmentStart,
            segmentEnd,
            column.day,
            timeWindow.startMinute
        );

        return [{ columnIndex, startRow, endRow }];
    })
);
