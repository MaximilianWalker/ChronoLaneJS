import assert from "node:assert/strict";
import test from "node:test";

import { resolveSlotDimension } from "../../../src/views/time-grid/sizing.js";
import type { SlotSizing } from "../../../src/views/time-grid/types.js";

test("resolves fixed, fluid, and minimum slot dimensions", () => {
    assert.deepEqual(
        resolveSlotDimension({ height: 48 }, "height"),
        { size: 48 }
    );
    assert.deepEqual(
        resolveSlotDimension({ minHeight: 0 }, "height", 50),
        { minSize: 0 }
    );
    assert.deepEqual(
        resolveSlotDimension({ minWidth: 92 }, "width"),
        { minSize: 92 }
    );
});

test("uses the dimension fallback only when the axis is omitted", () => {
    assert.deepEqual(
        resolveSlotDimension(undefined, "height", 50),
        { size: 50 }
    );
    assert.deepEqual(
        resolveSlotDimension(undefined, "width"),
        { minSize: 0 }
    );
});

test("rejects fixed and minimum values on the same axis", () => {
    assert.throws(
        () => resolveSlotDimension(
            { width: 92, minWidth: 80 } as unknown as SlotSizing,
            "width"
        ),
        /slotSizing\.width and slotSizing\.minWidth are mutually exclusive/
    );
    assert.throws(
        () => resolveSlotDimension(
            { height: 40, minHeight: 20 } as unknown as SlotSizing,
            "height",
            50
        ),
        /slotSizing\.height and slotSizing\.minHeight are mutually exclusive/
    );
});

test("rejects removed slot-sizing forms at runtime", () => {
    assert.throws(
        () => resolveSlotDimension(
            { height: "fluid" } as unknown as SlotSizing,
            "height",
            50
        ),
        /slotSizing\.height must be a positive finite number/
    );
    assert.throws(
        () => resolveSlotDimension(
            { width: { min: 92 } } as unknown as SlotSizing,
            "width"
        ),
        /slotSizing\.width must be a positive finite number/
    );
});

test("rejects invalid fixed slot dimensions", () => {
    for (const axis of ["width", "height"] as const) {
        for (const value of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
            const sizing = axis === "width"
                ? { width: value }
                : { height: value };
            assert.throws(
                () => resolveSlotDimension(sizing, axis),
                new RegExp(`slotSizing\\.${axis} must be a positive finite number`)
            );
        }
    }
});

test("rejects invalid minimum slot dimensions", () => {
    for (const axis of ["width", "height"] as const) {
        const property = axis === "width" ? "minWidth" : "minHeight";
        for (const minSize of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
            const sizing = axis === "width"
                ? { minWidth: minSize }
                : { minHeight: minSize };
            assert.throws(
                () => resolveSlotDimension(sizing, axis),
                new RegExp(
                    `slotSizing\\.${property} must be a non-negative finite number`
                )
            );
        }
    }
});
