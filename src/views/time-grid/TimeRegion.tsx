import type { TimeGridBackgroundEventProps } from "./types.js";

export default function TimeRegion({
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
