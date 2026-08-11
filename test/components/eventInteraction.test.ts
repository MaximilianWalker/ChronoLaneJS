import assert from "node:assert/strict";
import test from "node:test";

import type {
    KeyboardEvent,
    MouseEvent,
    SyntheticEvent
} from "react";

import { createEventInteractionProps } from "../../src/components/eventInteraction.js";
import type {
    CalendarEvent,
    NormalizedCalendarEvent
} from "../../src/types.js";

interface TestEvent extends CalendarEvent {
    id: string;
    start: Date;
    end: Date;
}

const event: NormalizedCalendarEvent<TestEvent> = {
    id: "planning",
    title: "Planning",
    start: new Date(2026, 8, 14, 9),
    end: new Date(2026, 8, 14, 10)
};

const mouseInteraction = {} as MouseEvent<HTMLElement>;

const keyboardInteraction = (
    key: string,
    shiftKey = false
): { interaction: KeyboardEvent<HTMLElement>; prevented: () => boolean } => {
    let defaultPrevented = false;
    return {
        interaction: {
            key,
            shiftKey,
            preventDefault: () => {
                defaultPrevented = true;
            }
        } as KeyboardEvent<HTMLElement>,
        prevented: () => defaultPrevented
    };
};

test("omits interaction props when no callbacks are provided", () => {
    assert.deepEqual(createEventInteractionProps({ event }), {
        onClick: undefined,
        onDoubleClick: undefined,
        onKeyDown: undefined,
        "aria-keyshortcuts": undefined
    });
});

test("connects the selection callback to the primary click action", () => {
    let selectedEvent: NormalizedCalendarEvent<TestEvent> | undefined;
    let selectedInteraction: SyntheticEvent | undefined;
    const props = createEventInteractionProps({
        event,
        onEventSelect: (nextEvent, interaction) => {
            selectedEvent = nextEvent;
            selectedInteraction = interaction;
        }
    });

    props.onClick?.(mouseInteraction);

    assert.strictEqual(selectedEvent, event);
    assert.strictEqual(selectedInteraction, mouseInteraction);
    assert.equal(props.onDoubleClick, undefined);
    assert.equal(props["aria-keyshortcuts"], undefined);
});

test("uses Enter for editing when selection has no primary action", () => {
    const interactions: SyntheticEvent[] = [];
    const props = createEventInteractionProps({
        event,
        onEventEdit: (_event, interaction) => interactions.push(interaction)
    });
    const ignored = keyboardInteraction("Escape");
    const accepted = keyboardInteraction("Enter");

    props.onKeyDown?.(ignored.interaction);
    props.onKeyDown?.(accepted.interaction);

    assert.equal(props["aria-keyshortcuts"], "Enter");
    assert.equal(ignored.prevented(), false);
    assert.equal(accepted.prevented(), true);
    assert.deepEqual(interactions, [accepted.interaction]);
});

test("reserves ordinary Enter for selection and edits with Shift+Enter", () => {
    const edits: SyntheticEvent[] = [];
    const props = createEventInteractionProps({
        event,
        onEventSelect: () => undefined,
        onEventEdit: (_event, interaction) => edits.push(interaction)
    });
    const enter = keyboardInteraction("Enter");
    const shiftEnter = keyboardInteraction("Enter", true);

    props.onKeyDown?.(enter.interaction);
    props.onKeyDown?.(shiftEnter.interaction);

    assert.equal(props["aria-keyshortcuts"], "Shift+Enter");
    assert.equal(enter.prevented(), false);
    assert.equal(shiftEnter.prevented(), true);
    assert.deepEqual(edits, [shiftEnter.interaction]);
});

test("omits editing behavior when the event predicate rejects the event", () => {
    const props = createEventInteractionProps({
        event,
        onEventEdit: () => assert.fail("Rejected events must not be editable."),
        canEditEvent: () => false
    });

    assert.equal(props.onDoubleClick, undefined);
    assert.equal(props.onKeyDown, undefined);
    assert.equal(props["aria-keyshortcuts"], undefined);
});
