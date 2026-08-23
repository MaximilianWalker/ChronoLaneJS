import {
    useCallback,
    useRef,
    useState
} from "react";
import type {
    KeyboardEvent,
    RefObject
} from "react";

import {
    getNavigationTarget,
    isNavigationKey
} from "./keyboard.js";
import type { LayoutSlot } from "./layout/types.js";

export interface SlotNavigation {
    rovingIndex: number;
    registerCell: (key: string, element: HTMLDivElement | null) => void;
    setActiveKey: (key: string) => void;
    handleKeyDown: (
        interaction: KeyboardEvent<HTMLElement>,
        slotIndex: number
    ) => void;
}

interface UseSlotNavigationOptions<Resource> {
    slots: LayoutSlot<Resource>[];
    columnCount: number;
    selectedIndex: number;
    selectable: boolean;
    wrapperRef: RefObject<HTMLDivElement | null>;
    stageRef: RefObject<HTMLDivElement | null>;
}

export const useSlotNavigation = <Resource>({
    slots,
    columnCount,
    selectedIndex,
    selectable,
    wrapperRef,
    stageRef
}: UseSlotNavigationOptions<Resource>): SlotNavigation => {
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const cellRefs = useRef(new Map<string, HTMLDivElement>());
    const rememberedIndex = activeKey == null
        ? -1
        : slots.findIndex(({ key }) => key === activeKey);
    const rovingIndex = rememberedIndex >= 0
        ? rememberedIndex
        : selectedIndex >= 0
            ? selectedIndex
            : 0;

    const registerCell = useCallback((
        key: string,
        element: HTMLDivElement | null
    ) => {
        if (element) {
            cellRefs.current.set(key, element);
        } else {
            cellRefs.current.delete(key);
        }
    }, []);

    const focus = useCallback((key: string) => {
        const cell = cellRefs.current.get(key);
        const target = selectable ? cell?.firstElementChild : cell;
        if (!(target instanceof HTMLElement)) return;

        setActiveKey(key);
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: "nearest", inline: "nearest" });
    }, [selectable]);

    const getVisibleRowCount = useCallback((cell: HTMLElement): number => {
        const wrapper = wrapperRef.current;
        const stage = stageRef.current;
        if (!wrapper || !stage) return 1;

        const wrapperBounds = wrapper.getBoundingClientRect();
        const stageBounds = stage.getBoundingClientRect();
        const cellBounds = cell.getBoundingClientRect();
        if (cellBounds.height <= 0) return 1;

        const visibleHeight = Math.max(
            0,
            Math.min(wrapperBounds.bottom, stageBounds.bottom)
            - Math.max(wrapperBounds.top, stageBounds.top)
        );
        return Math.max(1, Math.floor(visibleHeight / cellBounds.height));
    }, [stageRef, wrapperRef]);

    const handleKeyDown = useCallback((
        interaction: KeyboardEvent<HTMLElement>,
        slotIndex: number
    ) => {
        if (
            interaction.defaultPrevented
            || interaction.altKey
            || interaction.metaKey
            || !isNavigationKey(interaction.key)
        ) return;

        const targetIndex = getNavigationTarget({
            currentIndex: slotIndex,
            itemCount: slots.length,
            columnCount,
            pageRowCount: interaction.key === "PageUp"
                || interaction.key === "PageDown"
                ? getVisibleRowCount(interaction.currentTarget)
                : 1,
            controlKey: interaction.ctrlKey
        }, interaction.key);
        if (targetIndex == null) return;

        interaction.preventDefault();
        const targetSlot = slots[targetIndex];
        if (targetSlot && targetIndex !== slotIndex) focus(targetSlot.key);
    }, [columnCount, focus, getVisibleRowCount, slots]);

    return {
        rovingIndex,
        registerCell,
        setActiveKey,
        handleKeyDown
    };
};
