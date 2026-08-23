import type {
    ComponentType,
    SyntheticEvent
} from "react";

import type { ViewText } from "../../components/eventPresentation.js";
import type { CalendarSelectionRange } from "../../types.js";
import { toSlot } from "./contracts.js";
import type { LayoutSlot } from "./layout/types.js";
import type { SlotProps } from "./types.js";
import type { SlotNavigation } from "./useSlotNavigation.js";

interface CellProps<Resource> {
    slot: LayoutSlot<Resource>;
    index: number;
    selectedRange: CalendarSelectionRange | null;
    renderer: ComponentType<SlotProps<Resource>>;
    onSelect?: (
        slot: ReturnType<typeof toSlot<Resource>>,
        interaction: SyntheticEvent
    ) => void;
    navigation: SlotNavigation;
    text: ViewText;
}

const selectSlot = <Resource,>(
    interaction: SyntheticEvent,
    slot: LayoutSlot<Resource>,
    rendererSlot: ReturnType<typeof toSlot<Resource>>,
    onSelect: NonNullable<CellProps<Resource>["onSelect"]>,
    navigation: SlotNavigation
): void => {
    navigation.setActiveKey(slot.key);
    onSelect(rendererSlot, interaction);
};

export default function Cell<Resource>({
    slot,
    index,
    selectedRange,
    renderer: SlotRenderer,
    onSelect,
    navigation,
    text
}: CellProps<Resource>) {
    const rendererSlot = toSlot(slot);
    const selected = selectedRange != null
        && selectedRange.start < slot.end
        && selectedRange.end > slot.start;
    const select = onSelect
        ? (interaction: SyntheticEvent) => selectSlot(
            interaction,
            slot,
            rendererSlot,
            onSelect,
            navigation
        )
        : undefined;

    return (
        <div
            ref={(element) => navigation.registerCell(slot.key, element)}
            role={onSelect ? "gridcell" : undefined}
            aria-selected={onSelect ? selected : undefined}
            className="time-grid-view_slot-cell"
            style={{ gridColumn: slot.columnIndex + 1 }}
        >
            <SlotRenderer
                slot={rendererSlot}
                selected={selected}
                elementProps={{
                    className: `time-grid-view_slot${slot.columnIndex === 0
                        ? " is-first-column"
                        : ""}${slot.isDividerBoundary
                        ? " is-divider-boundary"
                        : ""}`,
                    "aria-label": select
                        ? text.messages.slotLabel({
                            view: text.context.view,
                            date: text.formatters.date(slot.start, text.context),
                            time: text.formatters.time(slot.start, text.context)
                        })
                        : undefined,
                    onClick: select,
                    onFocus: select
                        ? () => navigation.setActiveKey(slot.key)
                        : undefined,
                    onKeyDown: select
                        ? (interaction) => navigation.handleKeyDown(
                            interaction,
                            index
                        )
                        : undefined,
                    tabIndex: select
                        ? index === navigation.rovingIndex ? 0 : -1
                        : undefined
                }}
            />
        </div>
    );
}
