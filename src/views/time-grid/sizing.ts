import type { TimeGridSlotSizing } from "./types.js";

export type ResolvedSlotDimension =
    | { size: number; minSize?: never }
    | { size?: never; minSize: number };

/** Resolves and validates one public time-grid slot dimension. */
export const resolveSlotDimension = (
    sizing: TimeGridSlotSizing | undefined,
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
