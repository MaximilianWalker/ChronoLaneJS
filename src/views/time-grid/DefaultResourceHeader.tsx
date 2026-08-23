import type { ResourceHeaderProps } from "./types.js";

/** Renders the prepared title for one visible resource header group. */
export default function DefaultResourceHeader<Resource>({
    title
}: ResourceHeaderProps<Resource>) {
    return <span>{title}</span>;
}
