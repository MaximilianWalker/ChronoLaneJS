import type {
    KeyboardEvent,
    MouseEvent,
    PointerEvent
} from "react";

import { consumeSuppressedClick } from "./pointerDrag.js";

export const appendMoveShortcuts = (
    current: string | undefined,
    additional: string
): string => [...new Set(`${current ?? ""} ${additional}`.trim().split(/\s+/))]
    .join(" ");

export const handleMoveSurfaceClick = (
    interaction: MouseEvent<HTMLElement>,
    fallback?: (interaction: MouseEvent<HTMLElement>) => void
): void => {
    if (consumeSuppressedClick(interaction.currentTarget)) {
        interaction.preventDefault();
        interaction.stopPropagation();
        return;
    }

    fallback?.(interaction);
};

export const handleMoveSurfaceKeyDown = (
    interaction: KeyboardEvent<HTMLElement>,
    active: boolean,
    moveKeys: ReadonlySet<string>,
    handleMove: (interaction: KeyboardEvent<HTMLElement>) => void,
    fallback?: (interaction: KeyboardEvent<HTMLElement>) => void
): void => {
    if (active || moveKeys.has(interaction.key)) handleMove(interaction);
    if (!interaction.defaultPrevented) fallback?.(interaction);
};

export const handleMoveSurfacePointerUp = (
    interaction: PointerEvent<HTMLElement>,
    handleMove: (interaction: PointerEvent<HTMLElement>) => boolean,
    fallback?: (interaction: PointerEvent<HTMLElement>) => void
): void => {
    if (!handleMove(interaction)) fallback?.(interaction);
};

export const handleMoveSurfacePointerCancel = (
    interaction: PointerEvent<HTMLElement>,
    handleMove: (interaction: PointerEvent<HTMLElement>) => void,
    fallback?: (interaction: PointerEvent<HTMLElement>) => void
): void => {
    handleMove(interaction);
    fallback?.(interaction);
};
