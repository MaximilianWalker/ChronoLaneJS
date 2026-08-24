import assert from "node:assert/strict";
import test from "node:test";

import type {
    KeyboardEvent,
    MouseEvent,
    PointerEvent,
    SyntheticEvent
} from "react";

import { createEventInteractionProps } from "../../src/components/eventInteraction.js";
import type {
    CalendarEvent,
    CalendarEventInteractionContext,
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
const context: CalendarEventInteractionContext<never> = {
    view: "agenda",
    occurrence: {
        day: new Date(2026, 8, 14),
        resource: null,
        resourceId: null
    }
};
const target = {} as HTMLElement;

const mouseInteraction = (
    detail: number,
    timeStamp = detail
): MouseEvent<HTMLElement> => ({
    currentTarget: target,
    detail,
    timeStamp
} as MouseEvent<HTMLElement>);

const keyboardInteraction = (
    key: string,
    repeat = false
): {
    interaction: KeyboardEvent<HTMLElement>;
    prevented: () => boolean;
} => {
    let defaultPrevented = false;
    return {
        interaction: {
            currentTarget: target,
            key,
            repeat,
            preventDefault: () => {
                defaultPrevented = true;
            }
        } as KeyboardEvent<HTMLElement>,
        prevented: () => defaultPrevented
    };
};

test("omits interaction behavior when no callbacks are provided", () => {
    assert.deepEqual(createEventInteractionProps({ event, context }), {
        tabIndex: undefined,
        onClick: undefined,
        onDoubleClick: undefined,
        onContextMenu: undefined,
        onKeyDown: undefined,
        onPointerUp: undefined,
        onPointerCancel: undefined,
        "aria-keyshortcuts": undefined
    });
});

test("uses click and Space only for semantic selection", () => {
    const interactions: SyntheticEvent[] = [];
    const props = createEventInteractionProps({
        event,
        context,
        onEventSelect: (_event, interaction) => interactions.push(interaction)
    });
    const space = keyboardInteraction(" ");
    const enter = keyboardInteraction("Enter");
    const click = mouseInteraction(1);

    props.onClick?.(click);
    props.onKeyDown?.(space.interaction);
    props.onKeyDown?.(enter.interaction);

    assert.equal(props.tabIndex, 0);
    assert.equal(props["aria-keyshortcuts"], "Space");
    assert.equal(space.prevented(), true);
    assert.equal(enter.prevented(), false);
    assert.deepEqual(interactions, [click, space.interaction]);
});

test("selects once before opening during a double click", () => {
    const actions: string[] = [];
    const props = createEventInteractionProps({
        event,
        context,
        onEventSelect: () => actions.push("select"),
        onEventOpen: () => actions.push("open"),
        eventInteractions: {
            onClick: () => actions.push("raw-click"),
            onDoubleClick: () => actions.push("raw-double-click")
        }
    });

    props.onClick?.(mouseInteraction(1));
    props.onClick?.(mouseInteraction(2));
    props.onDoubleClick?.(mouseInteraction(2, 3));

    assert.deepEqual(actions, [
        "select",
        "raw-click",
        "raw-click",
        "open",
        "raw-double-click"
    ]);
});

test("uses Enter only for semantic opening", () => {
    const interactions: SyntheticEvent[] = [];
    const props = createEventInteractionProps({
        event,
        context,
        onEventOpen: (_event, interaction) => interactions.push(interaction)
    });
    const enter = keyboardInteraction("Enter");
    const space = keyboardInteraction(" ");

    props.onKeyDown?.(enter.interaction);
    props.onKeyDown?.(space.interaction);

    assert.equal(props["aria-keyshortcuts"], "Enter");
    assert.equal(enter.prevented(), true);
    assert.equal(space.prevented(), false);
    assert.deepEqual(interactions, [enter.interaction]);
});

test("semantic predicates do not suppress additive raw handlers", () => {
    const actions: string[] = [];
    const props = createEventInteractionProps({
        event,
        context,
        canSelectEvent: () => false,
        canOpenEvent: () => false,
        onEventSelect: () => assert.fail("Selection must be rejected."),
        onEventOpen: () => assert.fail("Opening must be rejected."),
        eventInteractions: {
            onClick: (_event, _interaction, receivedContext) => {
                assert.strictEqual(receivedContext, context);
                actions.push("raw-click");
            },
            onDoubleClick: () => actions.push("raw-double-click")
        }
    });

    props.onClick?.(mouseInteraction(1));
    props.onDoubleClick?.(mouseInteraction(2));

    assert.deepEqual(actions, ["raw-click", "raw-double-click"]);
    assert.equal(props.tabIndex, undefined);
});

test("combines semantic and raw keyboard shortcut metadata", () => {
    const props = createEventInteractionProps({
        event,
        context,
        onEventSelect: () => undefined,
        onEventOpen: () => undefined,
        eventInteractions: {
            onKeyDown: () => undefined,
            ariaKeyShortcuts: "Enter E"
        }
    });

    assert.equal(props["aria-keyshortcuts"], "Space Enter E");
});

test("opens once after two nearby primary touch taps", () => {
    let opens = 0;
    let selections = 0;
    const props = createEventInteractionProps({
        event,
        context,
        onEventSelect: () => {
            selections += 1;
        },
        onEventOpen: () => {
            opens += 1;
        }
    });
    const touch = (timeStamp: number, x: number): PointerEvent<HTMLElement> => ({
        currentTarget: target,
        pointerType: "touch",
        isPrimary: true,
        timeStamp,
        clientX: x,
        clientY: 10
    } as PointerEvent<HTMLElement>);

    props.onPointerUp?.(touch(100, 10));
    props.onClick?.(mouseInteraction(1, 110));
    props.onPointerUp?.(touch(300, 14));
    props.onClick?.(mouseInteraction(1, 310));
    props.onDoubleClick?.(mouseInteraction(2, 320));

    assert.equal(selections, 1);
    assert.equal(opens, 1);
});
