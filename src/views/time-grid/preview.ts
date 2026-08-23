import type { ViewText } from "../../components/eventPresentation.js";
import type {
    CalendarEvent,
    CalendarResourceConfig,
    CalendarResourceId,
    CalendarStyle
} from "../../types.js";
import type {
    MoveState,
    MultiDayMoveState,
    MultiDayResizeState,
    ResizeState
} from "./interactions/types.js";
import {
    createMultiDayEventDrop,
    createMultiDayEventPreview,
    createMultiDayEventResize
} from "./layout/multiDayEvents.js";
import {
    atDayMinute,
    getGridRows
} from "./layout/timeScale.js";
import type { ResolvedTimeWindow } from "./layout/timeScale.js";
import type { LayoutColumn } from "./layout/types.js";
import { createEventDrop } from "./move.js";
import { createEventResize } from "./resize.js";
import { resolveCalendarResourceTitle } from "./resources.js";

export interface EventPreviewSegment {
    columnIndex: number;
    startRow: number;
    endRow: number;
}

interface CreateEventPreviewSegmentsOptions<Resource> {
    start: Date;
    end: Date;
    resourceId: CalendarResourceId | null;
    columns: LayoutColumn<Resource>[];
    timeWindow: ResolvedTimeWindow;
}

/** Projects a complete event proposal into its overlapping visible columns. */
export const createEventPreviewSegments = <Resource>({
    start,
    end,
    resourceId,
    columns,
    timeWindow
}: CreateEventPreviewSegmentsOptions<Resource>): EventPreviewSegment[] => (
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

export interface PreviewSegment {
    key: string;
    style: CalendarStyle;
}

export interface MovePreview {
    announcement: string;
    segments: PreviewSegment[];
}

export interface ResizePreview {
    segments: PreviewSegment[];
}

interface TimedMovePreviewOptions<Event extends CalendarEvent, Resource> {
    move: MoveState<Event, Resource> | null;
    columns: LayoutColumn<Resource>[];
    timeWindow: ResolvedTimeWindow;
    resources?: CalendarResourceConfig<Event, Resource>;
    text: ViewText;
}

interface TimedResizePreviewOptions<Event extends CalendarEvent, Resource> {
    resize: ResizeState<Event, Resource> | null;
    columns: LayoutColumn<Resource>[];
    timeWindow: ResolvedTimeWindow;
}

interface MultiDayMovePreviewOptions<Event extends CalendarEvent, Resource> {
    move: MultiDayMoveState<Event, Resource> | null;
    columns: LayoutColumn<Resource>[];
    resources?: CalendarResourceConfig<Event, Resource>;
    text: ViewText;
}

interface MultiDayResizePreviewOptions<Event extends CalendarEvent, Resource> {
    resize: MultiDayResizeState<Event, Resource> | null;
    columns: LayoutColumn<Resource>[];
}

const resolveResourceLabel = <Event extends CalendarEvent, Resource>(
    resources: CalendarResourceConfig<Event, Resource> | undefined,
    resource: Resource | null,
    resourceId: CalendarResourceId | null
): string | undefined => {
    if (resource == null || resourceId == null) return undefined;

    const title = resolveCalendarResourceTitle(resources, resource, resourceId);
    return typeof title === "string" || typeof title === "number"
        ? String(title)
        : String(resourceId);
};

const createMoveAnnouncement = <Event extends CalendarEvent, Resource>(
    move: MoveState<Event, Resource> | MultiDayMoveState<Event, Resource>,
    start: Date,
    resources: CalendarResourceConfig<Event, Resource> | undefined,
    text: ViewText
): string => text.messages.eventMoveTarget({
    view: text.context.view,
    title: move.segment.event.title,
    date: text.formatters.date(start, text.context),
    time: text.formatters.time(start, text.context),
    resource: resolveResourceLabel(
        resources,
        move.target?.resource ?? null,
        move.target?.resourceId ?? null
    )
});

export const createTimedMovePreview = <Event extends CalendarEvent, Resource>({
    move,
    columns,
    timeWindow,
    resources,
    text
}: TimedMovePreviewOptions<Event, Resource>): MovePreview | null => {
    if (!move?.target) return null;

    const change = createEventDrop(move.segment, move.target);
    return {
        announcement: createMoveAnnouncement(move, change.start, resources, text),
        segments: createEventPreviewSegments({
            start: change.start,
            end: change.end,
            resourceId: change.destination.resourceId,
            columns,
            timeWindow
        }).map((segment) => ({
            key: String(segment.columnIndex),
            style: {
                "--color": move.segment.event.color,
                gridColumn: segment.columnIndex + 1,
                gridRow: `${segment.startRow} / ${segment.endRow}`
            }
        }))
    };
};

export const createTimedResizePreview = <Event extends CalendarEvent, Resource>({
    resize,
    columns,
    timeWindow
}: TimedResizePreviewOptions<Event, Resource>): ResizePreview | null => {
    if (!resize?.target) return null;

    const change = createEventResize(
        resize.event,
        resize.edge,
        resize.target,
        resize.source
    );
    return {
        segments: createEventPreviewSegments({
            start: change.start,
            end: change.end,
            resourceId: resize.source.resourceId,
            columns,
            timeWindow
        }).map((segment) => ({
            key: String(segment.columnIndex),
            style: {
                "--color": resize.event.color,
                gridColumn: segment.columnIndex + 1,
                gridRow: `${segment.startRow} / ${segment.endRow}`
            }
        }))
    };
};

export const createMultiDayMovePreview = <Event extends CalendarEvent, Resource>({
    move,
    columns,
    resources,
    text
}: MultiDayMovePreviewOptions<Event, Resource>): MovePreview | null => {
    if (!move?.target) return null;

    const change = createMultiDayEventDrop(move.segment, move.target);
    return {
        announcement: createMoveAnnouncement(move, change.start, resources, text),
        segments: createMultiDayEventPreview({
            event: move.segment.event,
            start: change.start,
            end: change.end,
            resourceId: change.destination.resourceId,
            columns
        }).map((segment) => ({
            key: `${segment.columnIndex}-${segment.columnSpan}`,
            style: {
                "--color": move.segment.event.color,
                gridColumn: `${segment.columnIndex + 1} / span ${segment.columnSpan}`,
                gridRow: move.segment.laneIndex + 1
            }
        }))
    };
};

export const createMultiDayResizePreview = <
    Event extends CalendarEvent,
    Resource
>({
    resize,
    columns
}: MultiDayResizePreviewOptions<Event, Resource>): ResizePreview | null => {
    if (resize?.targetOffset == null) return null;

    const change = createMultiDayEventResize({
        event: resize.segment.event,
        edge: resize.edge,
        dayOffset: resize.targetOffset,
        source: resize.source
    });
    return {
        segments: createMultiDayEventPreview({
            event: resize.segment.event,
            start: change.start,
            end: change.end,
            resourceId: resize.source.resourceId,
            columns
        }).map((segment) => ({
            key: `${segment.columnIndex}-${segment.columnSpan}`,
            style: {
                "--color": resize.segment.event.color,
                gridColumn: `${segment.columnIndex + 1} / span ${segment.columnSpan}`,
                gridRow: resize.segment.laneIndex + 1
            }
        }))
    };
};
