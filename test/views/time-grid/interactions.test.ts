import assert from "node:assert/strict";
import test from "node:test";

import type { CalendarEvent } from "../../../src/types.js";
import {
    reduceInteraction
} from "../../../src/views/time-grid/interactions/reducer.js";
import type {
    ActiveInteraction,
    MoveState,
    ResizeState
} from "../../../src/views/time-grid/interactions/types.js";

type Interaction = ActiveInteraction<CalendarEvent, unknown>;

const move = {
    kind: "move",
    handleKey: "event-move"
} as MoveState<CalendarEvent, unknown>;

const resize = {
    kind: "resize",
    handleKey: "event-resize"
} as ResizeState<CalendarEvent, unknown>;

test("starting an interaction replaces the active interaction", () => {
    const moving = reduceInteraction<CalendarEvent, unknown>(null, {
        type: "begin",
        interaction: move
    });
    const resizing = reduceInteraction(moving, {
        type: "begin",
        interaction: resize
    });

    assert.equal(moving, move);
    assert.equal(resizing, resize);
});

test("updates and finishes only the matching active interaction", () => {
    const updatedMove = { ...move, pointerId: 7 };
    const ignoreStaleUpdate = reduceInteraction<CalendarEvent, unknown>(resize, {
        type: "update",
        interaction: updatedMove
    });
    const updateActive = reduceInteraction<CalendarEvent, unknown>(move, {
        type: "update",
        interaction: updatedMove
    });
    const ignoreStaleFinish = reduceInteraction<CalendarEvent, unknown>(
        updateActive,
        { type: "finish", interaction: resize }
    );
    const finishActive = reduceInteraction<CalendarEvent, unknown>(
        ignoreStaleFinish,
        { type: "finish", interaction: updatedMove }
    );

    assert.equal(ignoreStaleUpdate, resize);
    assert.equal(updateActive, updatedMove);
    assert.equal(ignoreStaleFinish, updatedMove);
    assert.equal(finishActive, null satisfies Interaction);
});
