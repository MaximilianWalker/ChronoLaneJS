import type { TimeGridBackgroundEventProps } from "./types.js";

/** Renders the default non-interactive background event region. */
export default function Background({
    className,
    event,
    style
}: TimeGridBackgroundEventProps) {
    return (
        <div
            aria-hidden="true"
            className={className}
            data-background-event-id={event.id}
            style={style}
        />
    );
}
