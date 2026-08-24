import type {
    KeyboardEventHandler,
    MouseEventHandler,
    PointerEventHandler
} from "react";

import type {
    CalendarEvent,
    CalendarEventInteractionContext,
    CalendarEventInteractions,
    NormalizedCalendarEvent,
    SharedViewProps
} from "../types.js";

const DOUBLE_TAP_MAX_DELAY = 500;
const DOUBLE_TAP_MAX_DISTANCE = 24;

interface TouchTap {
    timeStamp: number;
    x: number;
    y: number;
}

const touchTaps = new WeakMap<HTMLElement, TouchTap>();
const touchOpenTimes = new WeakMap<HTMLElement, number>();

interface CreateEventInteractionPropsOptions<
    Event extends CalendarEvent,
    Resource
> {
    event: NormalizedCalendarEvent<Event>;
    context: CalendarEventInteractionContext<Resource>;
    canSelectEvent?: SharedViewProps<Event, Resource>["canSelectEvent"];
    canOpenEvent?: SharedViewProps<Event, Resource>["canOpenEvent"];
    onEventSelect?: SharedViewProps<Event, Resource>["onEventSelect"];
    onEventOpen?: SharedViewProps<Event, Resource>["onEventOpen"];
    eventInteractions?: CalendarEventInteractions<Event, Resource>;
}

/** Shared renderer props implementing semantic and raw event interactions. */
export interface EventInteractionProps {
    tabIndex?: number;
    onClick?: MouseEventHandler<HTMLElement>;
    onDoubleClick?: MouseEventHandler<HTMLElement>;
    onContextMenu?: MouseEventHandler<HTMLElement>;
    onKeyDown?: KeyboardEventHandler<HTMLElement>;
    onPointerUp?: PointerEventHandler<HTMLElement>;
    onPointerCancel?: PointerEventHandler<HTMLElement>;
    "aria-keyshortcuts"?: string;
}

const resolveShortcuts = <Event extends CalendarEvent, Resource>(
    semanticShortcuts: string[],
    event: NormalizedCalendarEvent<Event>,
    context: CalendarEventInteractionContext<Resource>,
    interactions?: CalendarEventInteractions<Event, Resource>
): string | undefined => {
    const rawValue = typeof interactions?.ariaKeyShortcuts === "function"
        ? interactions.ariaKeyShortcuts(event, context)
        : interactions?.ariaKeyShortcuts;
    const shortcuts = new Set([
        ...semanticShortcuts,
        ...(rawValue?.trim().split(/\s+/).filter(Boolean) ?? [])
    ]);

    return shortcuts.size > 0 ? [...shortcuts].join(" ") : undefined;
};

/**
 * Creates the composed interaction props for one rendered event occurrence.
 *
 * @remarks
 * Click and Space consistently mean selection. Double click, double tap, and
 * Enter consistently mean opening. Raw handlers run after the matching
 * semantic handler and retain the browser's real event sequence.
 *
 * @param options - Source event, rendered occurrence, and interaction policy.
 * @returns Standard React props ready for an event renderer root.
 */
export const createEventInteractionProps = <
    Event extends CalendarEvent,
    Resource
>({
    event,
    context,
    canSelectEvent,
    canOpenEvent,
    onEventSelect,
    onEventOpen,
    eventInteractions
}: CreateEventInteractionPropsOptions<Event, Resource>): EventInteractionProps => {
    const selectable = onEventSelect != null
        && (canSelectEvent?.(event, context) ?? true);
    const openable = onEventOpen != null
        && (canOpenEvent?.(event, context) ?? true);
    const keyboardEnabled = selectable
        || openable
        || eventInteractions?.onKeyDown != null;
    const semanticShortcuts = [
        ...(selectable ? ["Space"] : []),
        ...(openable ? ["Enter"] : [])
    ];

    return {
        tabIndex: keyboardEnabled ? 0 : undefined,
        onClick: selectable || eventInteractions?.onClick
            ? (interaction) => {
                const touchOpenTime = touchOpenTimes.get(interaction.currentTarget);
                const followsTouchOpen = touchOpenTime != null
                    && interaction.timeStamp - touchOpenTime < DOUBLE_TAP_MAX_DELAY;

                if (selectable && interaction.detail < 2 && !followsTouchOpen) {
                    onEventSelect(event, interaction, context);
                }
                eventInteractions?.onClick?.(event, interaction, context);
            }
            : undefined,
        onDoubleClick: openable || eventInteractions?.onDoubleClick
            ? (interaction) => {
                const touchOpenTime = touchOpenTimes.get(interaction.currentTarget);
                const alreadyOpenedByTouch = touchOpenTime != null
                    && interaction.timeStamp - touchOpenTime < DOUBLE_TAP_MAX_DELAY;

                if (openable && !alreadyOpenedByTouch) {
                    onEventOpen(event, interaction, context);
                }
                eventInteractions?.onDoubleClick?.(event, interaction, context);
            }
            : undefined,
        onContextMenu: eventInteractions?.onContextMenu
            ? (interaction) => eventInteractions.onContextMenu?.(
                event,
                interaction,
                context
            )
            : undefined,
        onKeyDown: keyboardEnabled
            ? (interaction) => {
                if (!interaction.repeat && interaction.key === " " && selectable) {
                    interaction.preventDefault();
                    onEventSelect(event, interaction, context);
                } else if (!interaction.repeat && interaction.key === "Enter" && openable) {
                    interaction.preventDefault();
                    onEventOpen(event, interaction, context);
                }

                eventInteractions?.onKeyDown?.(event, interaction, context);
            }
            : undefined,
        onPointerUp: openable
            ? (interaction) => {
                if (interaction.pointerType !== "touch" || !interaction.isPrimary) return;

                const target = interaction.currentTarget;
                const previousTap = touchTaps.get(target);
                const distance = previousTap == null
                    ? Number.POSITIVE_INFINITY
                    : Math.hypot(
                        interaction.clientX - previousTap.x,
                        interaction.clientY - previousTap.y
                    );

                if (
                    previousTap != null
                    && interaction.timeStamp - previousTap.timeStamp < DOUBLE_TAP_MAX_DELAY
                    && distance <= DOUBLE_TAP_MAX_DISTANCE
                ) {
                    touchTaps.delete(target);
                    touchOpenTimes.set(target, interaction.timeStamp);
                    onEventOpen(event, interaction, context);
                    return;
                }

                touchTaps.set(target, {
                    timeStamp: interaction.timeStamp,
                    x: interaction.clientX,
                    y: interaction.clientY
                });
            }
            : undefined,
        onPointerCancel: openable
            ? (interaction) => touchTaps.delete(interaction.currentTarget)
            : undefined,
        "aria-keyshortcuts": resolveShortcuts(
            semanticShortcuts,
            event,
            context,
            eventInteractions
        )
    };
};
