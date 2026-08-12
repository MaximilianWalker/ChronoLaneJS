import type { ElementType } from "react";

import type { TimeGridSlotProps } from "./types.js";

/**
 * Renders the default time slot as an interactive button or passive grid cell.
 */
export default function Slot({
    slot,
    selected,
    elementProps
}: TimeGridSlotProps) {
    const interactive = elementProps.onClick != null;
    const Component: ElementType = interactive ? "button" : "div";

    return (
        <Component
            {...elementProps}
            type={interactive ? "button" : undefined}
            className={`${elementProps.className}${slot.timeIndex === 0 ? " is-first-row" : ""}${slot.columnIndex === 0 ? " is-first-column" : ""}${slot.isDividerBoundary ? " is-divider-boundary" : ""}${selected ? " is-selected" : ""}`}
        />
    );
}
