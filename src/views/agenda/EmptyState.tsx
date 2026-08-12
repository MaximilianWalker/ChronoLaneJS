import type { AgendaEmptyProps } from "./types.js";

/** Renders the prepared message when an agenda range contains no events. */
export default function EmptyState({ message }: AgendaEmptyProps) {
    return <p className="agenda-view_empty">{message}</p>;
}
