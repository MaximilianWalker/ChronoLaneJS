import type {
    ComponentType,
    SyntheticEvent
} from "react";

import type { ViewText } from "../../components/eventPresentation.js";
import type { CalendarSelectionRange } from "../../types.js";
import Cell from "./Cell.js";
import type { LayoutSlot } from "./layout/types.js";
import type {
    Slot,
    SlotProps
} from "./types.js";
import type { SlotNavigation } from "./useSlotNavigation.js";

interface RowProps<Resource> {
    slots: LayoutSlot<Resource>[];
    rowIndex: number;
    columnCount: number;
    slotDuration: number;
    selectedRange: CalendarSelectionRange | null;
    renderer: ComponentType<SlotProps<Resource>>;
    onSelect?: (slot: Slot<Resource>, interaction: SyntheticEvent) => void;
    navigation: SlotNavigation;
    text: ViewText;
}

export default function Row<Resource>({
    slots,
    rowIndex,
    columnCount,
    slotDuration,
    selectedRange,
    renderer,
    onSelect,
    navigation,
    text
}: RowProps<Resource>) {
    const firstSlot = slots[0];
    if (!firstSlot) return null;

    return (
        <div
            role={onSelect ? "row" : undefined}
            className="time-grid-view_slot-row"
            style={{
                gridColumn: "1 / -1",
                gridRow: `${(firstSlot.timeIndex * slotDuration) + 1} / span ${firstSlot.duration}`
            }}
        >
            {slots.map((slot) => (
                <Cell
                    key={`${slot.key}-cell`}
                    slot={slot}
                    index={(rowIndex * columnCount) + slot.columnIndex}
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
