import { format } from "date-fns/format";
import type { Locale } from "date-fns";
import { useMemo } from "react";
import type {
    ComponentType,
    DragEvent,
    DragEventHandler,
    ReactNode,
    SyntheticEvent
} from "react";

import type {
    CalendarEvent,
    CalendarEventId,
    CalendarStyle,
    NormalizedCalendarEvent
} from "../../types.js";
import type {
    TimeGridBackgroundEventProps,
    TimeGridColumnHeaderProps,
    TimeGridEventLayout,
    TimeGridEventProps,
    TimeGridLayout,
    TimeGridSlot,
    TimeGridSlotProps
} from "./types.js";
import { isEventInteractionEnabled } from "./interactions.js";

/** Rounds percentages to stable CSS values without visible precision noise. */
const percentage = (value: number): number => Number(value.toFixed(6));

/** Calculates the width and horizontal offset of one overlapping event lane. */
const getLaneStyle = ({
    laneIndex,
    laneCount
}: Pick<TimeGridEventLayout, "laneIndex" | "laneCount">): CalendarStyle => {
    const laneWidth = 100 / laneCount;

    return {
        width: `calc(${percentage(laneWidth)}% - 4px)`,
        marginLeft: `calc(${percentage(laneIndex * laneWidth)}% + 2px)`,
        marginRight: "2px"
    };
};

/** Groups positioned items by column for direct rendering lookups. */
const groupByColumn = <Item extends { columnIndex: number }>(
    items: Item[],
    columnCount: number
): Item[][] => {
    const groups = Array.from({ length: columnCount }, () => [] as Item[]);
    items.forEach((item) => groups[item.columnIndex]?.push(item));
    return groups;
};

interface TimeGridProps<
    Event extends CalendarEvent,
    Resource
> {
    layout: TimeGridLayout<Event, Resource>;
    locale: Locale;
    dayFormat: string;
    step: number;
    headerHeight: number;
    timeLabelWidth: number;
    cellWidth?: number;
    cellHeight: number;
    showGrid: boolean;
    showGridLines: boolean;
    selectedRange?: { start: Date; end: Date };
    selectedEventIds: CalendarEventId[];
    eventDraggable: boolean | ((event: TimeGridEventLayout<Event, Resource>) => boolean);
    eventEditable: boolean | ((event: NormalizedCalendarEvent<Event>) => boolean);
    getResourceId: (resource: Resource) => unknown;
    getResourceTitle: (resource: Resource) => ReactNode;
    SlotComponent: ComponentType<TimeGridSlotProps<Resource>>;
    EventComponent: ComponentType<TimeGridEventProps<Event, Resource>>;
    BackgroundEventComponent: ComponentType<TimeGridBackgroundEventProps<Event, Resource>>;
    ColumnHeaderComponent: ComponentType<TimeGridColumnHeaderProps<Resource>>;
    onEventClick?: (interaction: SyntheticEvent, event: NormalizedCalendarEvent<Event>) => void;
    onSelectEvent?: (event: NormalizedCalendarEvent<Event>, interaction: SyntheticEvent) => void;
    onEventEdit?: (event: NormalizedCalendarEvent<Event>, interaction: SyntheticEvent) => void;
    onSlotClick?: (interaction: SyntheticEvent, slot: TimeGridSlot<Resource>) => void;
    onSelectSlot?: (slot: TimeGridSlot<Resource>, interaction: SyntheticEvent) => void;
    eventDropEnabled: boolean;
    onDrop: (interaction: DragEvent<HTMLElement>, slot: TimeGridSlot<Resource>) => void;
    onDragStart: (event: TimeGridEventLayout<Event, Resource>) => void;
    onDragEnd: DragEventHandler<HTMLElement>;
}

/**
 * Renders a prepared time-grid layout and connects its renderer components to
 * selection, editing, and drag-and-drop interactions.
 *
 * @remarks
 * This component performs no date normalization or event placement; callers
 * provide a complete {@link TimeGridLayout}.
 */
export default function Grid<
    Event extends CalendarEvent,
    Resource
>({
    layout,
    locale,
    dayFormat,
    step,
    headerHeight,
    timeLabelWidth,
    cellWidth,
    cellHeight,
    showGrid,
    showGridLines,
    selectedRange,
    selectedEventIds,
    eventDraggable,
    eventEditable,
    getResourceId,
    getResourceTitle,
    SlotComponent,
    EventComponent,
    BackgroundEventComponent,
    ColumnHeaderComponent,
    onEventClick,
    onSelectEvent,
    onEventEdit,
    onSlotClick,
    onSelectSlot,
    eventDropEnabled,
    onDrop,
    onDragStart,
    onDragEnd
}: TimeGridProps<Event, Resource>) {
    const {
        columns,
        slots,
        dividers,
        events,
        backgroundEvents,
        totalMinutes
    } = layout;
    const eventsByColumn = useMemo(
        () => groupByColumn(events, columns.length),
        [columns.length, events]
    );
    const backgroundEventsByColumn = useMemo(
        () => groupByColumn(backgroundEvents, columns.length),
        [backgroundEvents, columns.length]
    );
    const headerHeightValue = `${headerHeight}px`;
    const timeLabelWidthValue = `${timeLabelWidth}px`;
    const cellWidthValue = cellWidth
        ? `${cellWidth}px`
        : "minmax(var(--time-grid-day-min-width, 0px), 1fr)";
    const gridHeight = `${(totalMinutes / step) * cellHeight}px`;
    const gridRows = `repeat(${totalMinutes}, minmax(0, 1fr))`;

    return (
        <div
            className="time-grid-view_grid-wrapper"
            aria-label="Calendar grid"
            tabIndex={0}
        >
            <div
                className="time-grid-view_header"
                style={{
                    display: "grid",
                    gridTemplateColumns: `${timeLabelWidthValue} repeat(${columns.length}, ${cellWidthValue})`,
                    gridTemplateRows: headerHeightValue
                }}
            >
                {columns.map((column, columnIndex) => (
                    <div
                        key={column.key}
                        className="time-grid-view_column-header"
                        style={{ gridColumn: columnIndex + 2 }}
                    >
                        <ColumnHeaderComponent
                            column={column}
                            columnIndex={columnIndex}
                            day={column.day}
                            dayIndex={column.dayIndex}
                            resource={column.resource}
                            resourceIndex={column.resourceIndex}
                            resourceTitle={column.resource == null
                                ? null
                                : getResourceTitle(column.resource)}
                            locale={locale}
                            dayFormat={dayFormat}
                        />
                    </div>
                ))}
            </div>
            <div className="time-grid-view_body">
                <div
                    className="time-grid-view_time-labels"
                    style={{
                        display: "grid",
                        gridTemplateColumns: timeLabelWidthValue,
                        gridTemplateRows: gridRows,
                        height: gridHeight
                    }}
                >
                    {dividers.map(({ key, time, startRow, rowSpan }) => (
                        <div
                            key={key}
                            className="time-grid-view_time-label"
                            style={{ gridRow: `${startRow} / span ${rowSpan}` }}
                        >
                            <time dateTime={format(time, "HH:mm")}>
                                {format(time, "HH:mm", { locale })}
                            </time>
                        </div>
                    ))}
                </div>
                <div
                    className="time-grid-view_grid"
                    style={{
                        flexGrow: 1,
                        display: "grid",
                        gridTemplateColumns: `repeat(${columns.length}, ${cellWidthValue})`,
                        gridTemplateRows: gridRows,
                        height: gridHeight
                    }}
                >
                    {showGrid && slots.map((slot) => {
                        const selected = selectedRange
                            && selectedRange.start < slot.end
                            && selectedRange.end > slot.start;
                        const handleSelect = onSelectSlot || onSlotClick
                            ? (event: SyntheticEvent) => {
                                onSelectSlot?.(slot, event);
                                onSlotClick?.(event, slot);
                            }
                            : undefined;

                        return (
                            <SlotComponent
                                key={`${slot.key}-slot`}
                                className={`time-grid-view_slot${selected ? " is-selected" : ""}`}
                                timeIndex={slot.timeIndex}
                                dayIndex={slot.dayIndex}
                                columnIndex={slot.columnIndex}
                                step={step}
                                day={slot.day}
                                resource={slot.resource}
                                startTime={slot.start}
                                endTime={slot.end}
                                aria-label={`Calendar slot, ${format(slot.start, "EEEE, MMMM do, HH:mm", { locale })}`}
                                onClick={handleSelect}
                                onDragOver={eventDropEnabled
                                    ? (event) => event.preventDefault()
                                    : undefined}
                                onDrop={eventDropEnabled
                                    ? (event) => onDrop(event, slot)
                                    : undefined}
                                style={{
                                    gridRow: `${(slot.timeIndex * step) + 1} / ${(slot.timeIndex * step) + 1 + slot.duration}`,
                                    gridColumn: slot.columnIndex + 1,
                                    borderTop: showGridLines && slot.timeIndex === 0
                                        ? "var(--border)"
                                        : "none",
                                    borderLeft: showGridLines && slot.columnIndex === 0
                                        ? "var(--border)"
                                        : "none",
                                    borderRight: showGridLines ? "var(--border)" : "none",
                                    borderBottom: showGridLines
                                        ? slot.isDividerBoundary
                                            ? "var(--divider-border)"
                                            : "var(--border)"
                                        : "none"
                                }}
                            />
                        );
                    })}
                    {columns.map((column, columnIndex) => (
                        <div
                            key={`${column.key}-backgrounds`}
                            className="time-grid-view_background-events"
                            style={{
                                gridColumn: columnIndex + 1,
                                gridRow: `1 / ${totalMinutes + 1}`,
                                gridTemplateColumns: "minmax(0, 1fr)",
                                gridTemplateRows: gridRows
                            }}
                        >
                            {(backgroundEventsByColumn[columnIndex] ?? []).map((event) => (
                                    <BackgroundEventComponent
                                        key={`${event.id ?? "background"}-${event.start.getTime()}-${columnIndex}`}
                                        className="time-grid-view_background-event"
                                        event={event}
                                        dayIndex={event.dayIndex}
                                        columnIndex={columnIndex}
                                        resource={event.resource}
                                        style={{
                                            "--color": event.color,
                                            gridColumn: "1 / 2",
                                            gridRow: `${event.startRow} / ${event.endRow}`,
                                            ...event.style
                                        }}
                                    />
                            ))}
                        </div>
                    ))}
                    {columns.map((column, columnIndex) => (
                        <div
                            key={`${column.key}-events`}
                            className="time-grid-view_column-events"
                            data-column-index={columnIndex}
                            data-day-index={column.dayIndex}
                            style={{
                                gridColumn: columnIndex + 1,
                                gridRow: `1 / ${totalMinutes + 1}`,
                                gridTemplateColumns: "minmax(0, 1fr)",
                                gridTemplateRows: gridRows
                            }}
                        >
                            {(eventsByColumn[columnIndex] ?? []).map((event) => {
                                    const calendarEvent = event as unknown as NormalizedCalendarEvent<Event>;
                                    const resourceId = event.resource == null
                                        ? undefined
                                        : getResourceId(event.resource);
                                    const draggable = eventDropEnabled
                                        && isEventInteractionEnabled(eventDraggable, event);
                                    const editable = Boolean(onEventEdit)
                                        && isEventInteractionEnabled(eventEditable, calendarEvent);
                                    const hasPrimaryAction = Boolean(onEventClick || onSelectEvent);
                                    const selected = event.id != null
                                        && selectedEventIds.includes(event.id);

                                    return (
                                        <EventComponent
                                            key={`${event.id ?? event.title ?? "event"}-${event.start.getTime()}-${event.end.getTime()}-${columnIndex}`}
                                            className={`time-grid-view_event${selected ? " is-selected" : ""}`}
                                            event={event}
                                            dayIndex={event.dayIndex}
                                            columnIndex={columnIndex}
                                            laneIndex={event.laneIndex}
                                            laneCount={event.laneCount}
                                            resource={event.resource}
                                            resourceId={resourceId}
                                            draggable={draggable}
                                            onDragStart={draggable ? () => onDragStart(event) : undefined}
                                            onDragEnd={draggable ? onDragEnd : undefined}
                                            onClick={hasPrimaryAction
                                                ? (clickEvent) => {
                                                    onSelectEvent?.(calendarEvent, clickEvent);
                                                    onEventClick?.(clickEvent, calendarEvent);
                                                }
                                                : undefined}
                                            onDoubleClick={editable
                                                ? (editEvent) => onEventEdit?.(calendarEvent, editEvent)
                                                : undefined}
                                            onKeyDown={editable
                                                ? (keyEvent) => {
                                                    const shouldEdit = hasPrimaryAction
                                                        ? keyEvent.shiftKey && keyEvent.key === "Enter"
                                                        : keyEvent.key === "Enter";
                                                    if (!shouldEdit) return;
                                                    keyEvent.preventDefault();
                                                    onEventEdit?.(calendarEvent, keyEvent);
                                                }
                                                : undefined}
                                            aria-keyshortcuts={editable
                                                ? hasPrimaryAction ? "Shift+Enter" : "Enter"
                                                : undefined}
                                            aria-label={[
                                                event.title ?? "Calendar event",
                                                `${format(event.start, "EEEE, MMMM do, HH:mm", { locale })} to ${format(event.end, "EEEE, MMMM do, HH:mm", { locale })}`,
                                                event.description
                                            ].filter(Boolean).join(", ")}
                                            style={{
                                                "--color": event.color,
                                                gridColumn: "1 / 2",
                                                gridRow: `${event.startRow} / ${event.endRow}`,
                                                overflow: "hidden",
                                                ...getLaneStyle(event),
                                                ...event.style
                                            }}
                                            titleStyle={event.titleStyle}
                                            descriptionStyle={event.descriptionStyle}
                                        />
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
