import type { ElementType } from "react";

import type { TimeGridSlotProps } from "../../../types.js";

export default function TimeGridSlot({
    className,
    onClick,
    onDragOver,
    onDrop,
    style,
    "aria-label": ariaLabel
}: TimeGridSlotProps) {
    const Component: ElementType = onClick ? "button" : "div";

    return (
        <Component
            type={onClick ? "button" : undefined}
            aria-label={onClick ? ariaLabel : undefined}
            className={className}
            onClick={onClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={style}
        />
    );
}
