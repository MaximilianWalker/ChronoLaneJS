import type { CalendarStyle } from "../../types.js";
import type { SlotSizing } from "./types.js";

const DEFAULT_SLOT_HEIGHT = 50;

export type ResolvedSlotDimension =
    | { size: number; minSize?: never }
    | { size?: never; minSize: number };

/** Resolves and validates one public time-grid slot dimension. */
export const resolveSlotDimension = (
    sizing: SlotSizing | undefined,
    axis: "width" | "height",
    fallbackSize?: number
): ResolvedSlotDimension => {
    const size = axis === "width" ? sizing?.width : sizing?.height;
    const minSize = axis === "width" ? sizing?.minWidth : sizing?.minHeight;
    const minProperty = axis === "width" ? "minWidth" : "minHeight";

    if (size !== undefined && minSize !== undefined) {
        throw new RangeError(
            `slotSizing.${axis} and slotSizing.${minProperty} are mutually exclusive.`
        );
    }

    if (size !== undefined) {
        if (!Number.isFinite(size) || size <= 0) {
            throw new RangeError(
                `slotSizing.${axis} must be a positive finite number.`
            );
        }

        return { size };
    }

    if (minSize !== undefined) {
        if (!Number.isFinite(minSize) || minSize < 0) {
            throw new RangeError(
                `slotSizing.${minProperty} must be a non-negative finite number.`
            );
        }

        return { minSize };
    }

    return fallbackSize === undefined
        ? { minSize: 0 }
        : { size: fallbackSize };
};

export interface GridSizing {
    fixedWidth?: number;
    fixedHeight?: number;
    rowTemplate: string;
    height?: string;
    minHeight?: string;
    wrapperStyle: CalendarStyle;
}

export const createGridSizing = (
    sizing: SlotSizing | undefined,
    totalMinutes: number,
    slotDuration: number,
    columnCount: number,
    headerRowCount: number
): GridSizing => {
    const width = resolveSlotDimension(sizing, "width");
    const height = resolveSlotDimension(
        sizing,
        "height",
        DEFAULT_SLOT_HEIGHT
    );
    const slotCount = totalMinutes / slotDuration;
    const widthValue = width.size !== undefined
        ? `${width.size}px`
        : `minmax(${width.minSize}px, 1fr)`;

    return {
        fixedWidth: width.size,
        fixedHeight: height.size,
        rowTemplate: `repeat(${totalMinutes}, minmax(0, 1fr))`,
        height: height.size === undefined
            ? undefined
            : `${slotCount * height.size}px`,
        minHeight: height.size === undefined && height.minSize > 0
            ? `${slotCount * height.minSize}px`
            : undefined,
        wrapperStyle: {
            "--_time-grid-header-row-count": headerRowCount,
            "--_time-grid-slot-columns": `repeat(${columnCount}, ${widthValue})`
        }
    };
};
