import type { TimeGridBackgroundEventProps } from "./types.js";

/** Renders the default non-interactive background event region. */
export default function Background({
    event,
    elementProps
}: TimeGridBackgroundEventProps) {
    return (
        <div
            {...elementProps}
            data-background-event-id={event.id}
        />
    );
}
