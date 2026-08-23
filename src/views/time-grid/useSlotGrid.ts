import { useMemo } from "react";
import type {
    RefObject,
    SyntheticEvent
} from "react";

import type { ViewText } from "../../components/eventPresentation.js";
import type {
    CalendarRendererElementProps,
    CalendarSelectionRange
} from "../../types.js";
import { toSlot } from "./contracts.js";
import type { LayoutSlot } from "./layout/types.js";
import type { Slot } from "./types.js";
import { useSlotNavigation } from "./useSlotNavigation.js";
import type { SlotNavigation } from "./useSlotNavigation.js";

export interface SlotCellModel<Resource> {
    key: string;
    columnIndex: number;
    slot: Slot<Resource>;
    selected: boolean;
    register: (element: HTMLDivElement | null) => void;
    elementProps: CalendarRendererElementProps;
}

export interface SlotRowModel<Resource> {
    key: string;
    gridRow: string;
    cells: SlotCellModel<Resource>[];
}

interface UseSlotGridOptions<Resource> {
    slots: LayoutSlot<Resource>[];
    slotRows: LayoutSlot<Resource>[][];
    columnCount: number;
    slotDuration: number;
    selectedRange: CalendarSelectionRange | null;
    onSelect?: (slot: Slot<Resource>, interaction: SyntheticEvent) => void;
    wrapperRef: RefObject<HTMLDivElement | null>;
    stageRef: RefObject<HTMLDivElement | null>;
    text: ViewText;
}

interface CreateRowsOptions<Resource> {
    slotRows: LayoutSlot<Resource>[][];
    columnCount: number;
    slotDuration: number;
    selectedRange: CalendarSelectionRange | null;
    onSelect?: (slot: Slot<Resource>, interaction: SyntheticEvent) => void;
    navigation: SlotNavigation;
    text: ViewText;
}

const overlapsSelection = <Resource,>(
    slot: LayoutSlot<Resource>,
    selectedRange: CalendarSelectionRange | null
): boolean => selectedRange != null
    && selectedRange.start < slot.end
    && selectedRange.end > slot.start;

const createRows = <Resource,>({
    slotRows,
    columnCount,
    slotDuration,
    selectedRange,
    onSelect,
    navigation,
    text
}: CreateRowsOptions<Resource>): SlotRowModel<Resource>[] => slotRows.flatMap((
    slots,
    rowIndex
) => {
    const firstSlot = slots[0];
    if (!firstSlot) return [];

    return [{
        key: `${firstSlot.key}-row`,
        gridRow: `${(firstSlot.timeIndex * slotDuration) + 1} / span ${firstSlot.duration}`,
        cells: slots.map((slot) => {
            const index = (rowIndex * columnCount) + slot.columnIndex;
            const rendererSlot = toSlot(slot);
            const selected = overlapsSelection(slot, selectedRange);
            const select = onSelect
                ? (interaction: SyntheticEvent) => {
                    navigation.setActiveKey(slot.key);
                    onSelect(rendererSlot, interaction);
                }
                : undefined;

            return {
                key: `${slot.key}-cell`,
                columnIndex: slot.columnIndex,
                slot: rendererSlot,
                selected,
                register: (element) => navigation.registerCell(slot.key, element),
                elementProps: {
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
                }
            };
        })
    }];
});

export const useSlotGrid = <Resource,>({
    slots,
    slotRows,
    columnCount,
    slotDuration,
    selectedRange,
    onSelect,
    wrapperRef,
    stageRef,
    text
}: UseSlotGridOptions<Resource>): SlotRowModel<Resource>[] => {
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

    return useMemo(() => createRows({
        slotRows,
        columnCount,
        slotDuration,
        selectedRange,
        onSelect,
        navigation: {
            rovingIndex,
            registerCell,
            setActiveKey,
            handleKeyDown
        },
        text
    }), [
        columnCount,
        handleKeyDown,
        onSelect,
        registerCell,
        rovingIndex,
        selectedRange,
        setActiveKey,
        slotDuration,
        slotRows,
        text
    ]);
};
