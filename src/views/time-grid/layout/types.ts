import type {
    CalendarEvent,
    CalendarResourceId,
    NormalizedCalendarEvent
} from "../../../types.js";
import type {
    TimeGridColumn,
    TimeGridSlot
} from "../types.js";

export interface LayoutColumn<Resource = unknown>
    extends TimeGridColumn<Resource> {
    key: string;
    dayIndex: number;
    resourceIndex: number | null;
}

export interface LayoutSlot<Resource = unknown>
    extends TimeGridSlot<Resource> {
    key: string;
    timeIndex: number;
    dayIndex: number;
    columnIndex: number;
    isDividerBoundary: boolean;
}

export type LayoutEventSegment<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> = Omit<NormalizedCalendarEvent<Event>, "resource"> & {
    event: NormalizedCalendarEvent<Event>;
    day: Date;
    dayIndex: number;
    columnIndex: number;
    resource: Resource | null;
    resourceId: CalendarResourceId | null;
    resourceIndex: number | null;
    startRow: number;
    endRow: number;
};

export type LayoutEvent<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> = LayoutEventSegment<Event, Resource> & {
    laneIndex: number;
    laneCount: number;
};

export interface LayoutDivider {
    key: string;
    time: Date;
    startRow: number;
    rowSpan: number;
}

export interface TimeGridLayout<
    Event extends CalendarEvent = CalendarEvent,
    Resource = unknown
> {
    columns: LayoutColumn<Resource>[];
    slots: LayoutSlot<Resource>[];
    dividers: LayoutDivider[];
    events: LayoutEvent<Event, Resource>[];
    backgroundEvents: LayoutEventSegment<Event, Resource>[];
    totalMinutes: number;
}
