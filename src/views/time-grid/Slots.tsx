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
import { toSlot } from "./contracts.js";
import type { LayoutSlot } from "./layout/types.js";
import { useSlotNavigation } from "./useSlotNavigation.js";

const overlapsSelection = <Resource,>(
    slot: LayoutSlot<Resource>,
    selectedRange: CalendarSelectionRange | null
): boolean => selectedRange != null
    && selectedRange.start < slot.end
    && selectedRange.end > slot.start;

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
    const columnCount = columns.length;
    const selectedIndex = selectedRange == null
        ? -1
        : slots.findIndex((slot) => overlapsSelection(slot, selectedRange));
    const {
        rovingIndex,
        registerCell,
        setActiveKey,
        handleKeyDown
    } = useSlotNavigation({
        slots,
        columnCount,
        selectedIndex,
        selectable: onSelect != null,
        wrapperRef,
        stageRef
    });
    const rowTemplate = `repeat(${totalMinutes}, minmax(0, 1fr))`;
    const slotRowElements = slotRows.flatMap((rowSlots, rowIndex) => {
        const firstSlot = rowSlots[0];
        if (!firstSlot) return [];

        return [(
            <div
                key={`${firstSlot.key}-row`}
                role={onSelect ? "row" : undefined}
                className="time-grid-view_slot-row"
                style={{
                    gridColumn: "1 / -1",
                    gridRow: `${(firstSlot.timeIndex * slotDuration) + 1} / span ${firstSlot.duration}`
                }}
            >
                {rowSlots.map((slot) => {
                    const index = (rowIndex * columnCount) + slot.columnIndex;
                    const rendererSlot = toSlot(slot);
                    const selected = overlapsSelection(slot, selectedRange);
                    const select = onSelect
                        ? (interaction: SyntheticEvent) => {
                            setActiveKey(slot.key);
                            onSelect(rendererSlot, interaction);
                        }
                        : undefined;

                    return (
                        <div
                            key={`${slot.key}-cell`}
                            ref={(element) => registerCell(slot.key, element)}
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
                                            date: text.formatters.date(
                                                slot.start,
                                                text.context
                                            ),
                                            time: text.formatters.time(
                                                slot.start,
                                                text.context
                                            )
                                        })
                                        : undefined,
                                    onClick: select,
                                    onFocus: select
                                        ? () => setActiveKey(slot.key)
                                        : undefined,
                                    onKeyDown: select
                                        ? (interaction) => handleKeyDown(
                                            interaction,
                                            index
                                        )
                                        : undefined,
                                    tabIndex: select
                                        ? index === rovingIndex ? 0 : -1
                                        : undefined
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        )];
    });

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
            {slotRowElements}
        </div>
    );
}
