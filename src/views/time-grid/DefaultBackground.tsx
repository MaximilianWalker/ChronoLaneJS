import type { BackgroundEventProps } from "./types.js";

/** Renders the default non-interactive background event region. */
export default function DefaultBackground({
    event,
    elementProps
}: BackgroundEventProps) {
    return (
        <div
            {...elementProps}
            data-background-event-id={event.id}
        />
    );
}
