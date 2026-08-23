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
import Row from "./Row.js";
import type { Layout } from "./layout/types.js";
import type {
    Slot,
    SlotProps
} from "./types.js";
import { useSlotNavigation } from "./useSlotNavigation.js";

interface SlotsProps<Event extends CalendarEvent, Resource> {
    layout: Pick<Layout<Event, Resource>,
        "columns" | "slots" | "slotRows" | "totalMinutes">;
    slotDuration: number;
    selectedRange: CalendarSelectionRange | null;
    columnLabels: string[];
    renderer: ComponentType<SlotProps<Resource>>;
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
    renderer,
    onSelect,
    wrapperRef,
    stageRef,
    text
}: SlotsProps<Event, Resource>) {
    const selectedIndex = selectedRange == null
        ? -1
        : slots.findIndex((slot) => (
            selectedRange.start < slot.end
            && selectedRange.end > slot.start
        ));
    const navigation = useSlotNavigation({
        slots,
        columnCount: columns.length,
        selectedIndex,
        selectable: onSelect != null,
        wrapperRef,
        stageRef
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
            {slotRows.map((row, rowIndex) => (
                <Row
                    key={`${row[0]?.key ?? rowIndex}-row`}
                    slots={row}
                    rowIndex={rowIndex}
                    columnCount={columns.length}
                    slotDuration={slotDuration}
                    selectedRange={selectedRange}
                    renderer={renderer}
                    onSelect={onSelect}
                    navigation={navigation}
                    text={text}
                />
            ))}
        </div>
    );
}
