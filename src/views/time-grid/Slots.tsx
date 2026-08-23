import type {
    ComponentType,
    RefObject,
    SyntheticEvent
} from "react";

import type { ViewText } from "../../components/eventPresentation.js";
import type {
    CalendarEvent,
    CalendarSelectionRange
} from "../../types.js";
import type { Layout } from "./layout/types.js";
import type {
    Slot,
    SlotProps
} from "./types.js";
import { useSlotGrid } from "./useSlotGrid.js";

interface SlotsProps<Event extends CalendarEvent, Resource> {
    layout: Pick<Layout<Event, Resource>,
        "columns" | "slots" | "slotRows" | "totalMinutes">;
    slotDuration: number;
    selectedRange: CalendarSelectionRange | null;
    columnLabels: string[];
    slotRenderer: ComponentType<SlotProps<Resource>>;
    onSelect?: (slot: Slot<Resource>, interaction: SyntheticEvent) => void;
    wrapperRef: RefObject<HTMLDivElement | null>;
    stageRef: RefObject<HTMLDivElement | null>;
    text: ViewText;
}

export default function Slots<Event extends CalendarEvent, Resource>({
    layout: { columns, slots, slotRows, totalMinutes },
    slotDuration,
    selectedRange,
    columnLabels,
    slotRenderer: SlotRenderer,
    onSelect,
    wrapperRef,
    stageRef,
    text
}: SlotsProps<Event, Resource>) {
    const rows = useSlotGrid({
        slots,
        columnCount: columns.length,
        slotRows,
        slotDuration,
        selectedRange,
        onSelect,
        wrapperRef,
        stageRef,
        text
    });
    const rowTemplate = `repeat(${totalMinutes}, minmax(0, 1fr))`;

    return (
        <div
            className="time-grid-view_grid"
            role={onSelect ? "grid" : undefined}
            aria-label={onSelect
                ? text.messages.timeGridLabel({ view: text.context.view })
                : undefined}
            aria-multiselectable={onSelect != null || undefined}
            style={{ gridTemplateRows: rowTemplate }}
        >
            {onSelect && (
                <div
                    role="row"
                    className="time-grid-view_accessible-header-row"
                >
                    {columns.map((column, columnIndex) => (
                        <div
                            key={`${column.key}-accessible-header`}
                            role="columnheader"
                        >
                            {columnLabels[columnIndex]}
                        </div>
                    ))}
                </div>
            )}
            {rows.map((row) => (
                <div
                    key={row.key}
                    role={onSelect ? "row" : undefined}
                    className="time-grid-view_slot-row"
                    style={{
                        gridColumn: "1 / -1",
                        gridRow: row.gridRow
                    }}
                >
                    {row.cells.map((cell) => (
                        <div
                            key={cell.key}
                            ref={cell.register}
                            role={onSelect ? "gridcell" : undefined}
                            aria-selected={onSelect
                                ? cell.selected
                                : undefined}
                            className="time-grid-view_slot-cell"
                            style={{ gridColumn: cell.columnIndex + 1 }}
                        >
                            <SlotRenderer
                                slot={cell.slot}
                                selected={cell.selected}
                                elementProps={cell.elementProps}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
