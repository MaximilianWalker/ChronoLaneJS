import type { EmptyProps } from "./types.js";

/** Renders the prepared message when an agenda range contains no events. */
export default function DefaultEmpty({ message }: EmptyProps) {
    return <p className="agenda-view_empty">{message}</p>;
}
