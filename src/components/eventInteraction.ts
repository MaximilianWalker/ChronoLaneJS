import type {
    KeyboardEventHandler,
    MouseEventHandler,
    SyntheticEvent
} from "react";

import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../types.js";

type EventAction<Event extends CalendarEvent> = (
    event: NormalizedCalendarEvent<Event>,
    interaction: SyntheticEvent
) => void;

interface CreateEventInteractionPropsOptions<Event extends CalendarEvent> {
    event: NormalizedCalendarEvent<Event>;
    onEventSelect?: EventAction<Event>;
    onEventEdit?: EventAction<Event>;
    canEditEvent?: (event: NormalizedCalendarEvent<Event>) => boolean;
}

/** Shared renderer props implementing calendar event selection and editing. */
export interface EventInteractionProps {
    onClick?: MouseEventHandler<HTMLElement>;
    onDoubleClick?: MouseEventHandler<HTMLElement>;
    onKeyDown?: KeyboardEventHandler<HTMLElement>;
    "aria-keyshortcuts"?: "Enter" | "Shift+Enter";
}

/**
 * Creates consistent selection, editing, and keyboard behavior for an event.
 *
 * Selection uses the renderer's primary click action. Editing uses a double
 * click and `Enter`, or `Shift+Enter` when ordinary `Enter` is reserved for
 * selection. Editing props are omitted when the callback is absent or the
 * event-specific predicate rejects the event.
 *
 * @param options - Source event, callbacks, and optional edit predicate.
 * @returns Handler and accessibility props ready for an event renderer.
 */
export const createEventInteractionProps = <Event extends CalendarEvent>({
    event,
    onEventSelect,
    onEventEdit,
    canEditEvent
}: CreateEventInteractionPropsOptions<Event>): EventInteractionProps => {
    const selectable = onEventSelect != null;
    const editable = onEventEdit != null && (canEditEvent?.(event) ?? true);
    const keyboardShortcut = selectable ? "Shift+Enter" : "Enter";

    return {
        onClick: selectable
            ? (interaction) => onEventSelect(event, interaction)
            : undefined,
        onDoubleClick: editable
            ? (interaction) => onEventEdit(event, interaction)
            : undefined,
        onKeyDown: editable
            ? (interaction) => {
                const shouldEdit = keyboardShortcut === "Shift+Enter"
                    ? interaction.shiftKey && interaction.key === "Enter"
                    : interaction.key === "Enter";
                if (!shouldEdit) return;

                interaction.preventDefault();
                onEventEdit(event, interaction);
            }
            : undefined,
        "aria-keyshortcuts": editable ? keyboardShortcut : undefined
    };
};
