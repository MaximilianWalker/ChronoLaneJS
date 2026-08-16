import type { TimeGridResourceHeaderProps } from "./types.js";

/** Renders the prepared title for one visible resource header group. */
export default function ResourceHeader<Resource>({
    title
}: TimeGridResourceHeaderProps<Resource>) {
    return <span>{title}</span>;
}
