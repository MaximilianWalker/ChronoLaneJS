import { format } from "date-fns";

const percentage = (value) => Number(value.toFixed(6));

const getLaneStyle = ({ laneIndex, laneCount }) => {
    const laneWidth = 100 / laneCount;

    return {
        width: `calc(${percentage(laneWidth)}% - 4px)`,
        marginLeft: `calc(${percentage(laneIndex * laneWidth)}% + 2px)`,
        marginRight: "2px"
    };
};

const isEnabledForEvent = (value, event) => (
    typeof value === "function" ? value(event) : Boolean(value)
);

export default function TimeGrid({
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
}) {
    const {
        columns,
        slots,
        dividers,
        events,
        backgroundEvents,
        totalMinutes
    } = layout;
    const headerHeightValue = `${headerHeight}px`;
    const timeLabelWidthValue = `${timeLabelWidth}px`;
    const cellWidthValue = cellWidth
        ? `${cellWidth}px`
        : "minmax(var(--time-grid-day-min-width, 0px), 1fr)";
    const gridHeight = `${(totalMinutes / step) * cellHeight}px`;
    const gridRows = `repeat(${totalMinutes}, minmax(0, 1fr))`;

    return (
        <div className="time-grid-view_grid-wrapper">
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
                            ? (event) => {
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
                            {backgroundEvents
                                .filter((event) => event.columnIndex === columnIndex)
                                .map((event) => (
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
                            {events
                                .filter((event) => event.columnIndex === columnIndex)
                                .map((event) => {
                                    const resourceId = event.resource == null
                                        ? undefined
                                        : getResourceId(event.resource);
                                    const draggable = eventDropEnabled
                                        && isEnabledForEvent(eventDraggable, event);
                                    const editable = Boolean(onEventEdit)
                                        && isEnabledForEvent(eventEditable, event);
                                    const hasPrimaryAction = Boolean(onEventClick || onSelectEvent);
                                    const selected = selectedEventIds.includes(event.id);

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
                                                    onSelectEvent?.(event, clickEvent);
                                                    onEventClick?.(clickEvent, event);
                                                }
                                                : undefined}
                                            onDoubleClick={editable
                                                ? (editEvent) => onEventEdit(event, editEvent)
                                                : undefined}
                                            onKeyDown={editable
                                                ? (keyEvent) => {
                                                    const shouldEdit = hasPrimaryAction
                                                        ? keyEvent.shiftKey && keyEvent.key === "Enter"
                                                        : keyEvent.key === "Enter";
                                                    if (!shouldEdit) return;
                                                    keyEvent.preventDefault();
                                                    onEventEdit(event, keyEvent);
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
