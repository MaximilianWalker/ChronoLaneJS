import assert from "node:assert/strict";
import test from "node:test";

import {
    getNavigationTarget,
    isNavigationKey
} from "../../../src/views/time-grid/keyboard.js";
import type { NavigationKey } from "../../../src/views/time-grid/keyboard.js";

const target = (
    currentIndex: number,
    key: NavigationKey,
    overrides: Partial<Parameters<typeof getNavigationTarget>[0]> = {}
) => getNavigationTarget({
    currentIndex,
    itemCount: 12,
    columnCount: 3,
    pageRowCount: 2,
    controlKey: false,
    ...overrides
}, key);

test("recognizes only time-grid navigation keys", () => {
    assert.equal(isNavigationKey("ArrowDown"), true);
    assert.equal(isNavigationKey("PageUp"), true);
    assert.equal(isNavigationKey("Enter"), false);
    assert.equal(isNavigationKey("Tab"), false);
});

test("moves through rows and columns without wrapping", () => {
    assert.equal(target(4, "ArrowLeft"), 3);
    assert.equal(target(4, "ArrowRight"), 5);
    assert.equal(target(4, "ArrowUp"), 1);
    assert.equal(target(4, "ArrowDown"), 7);

    assert.equal(target(3, "ArrowLeft"), 3);
    assert.equal(target(5, "ArrowRight"), 5);
    assert.equal(target(1, "ArrowUp"), 1);
    assert.equal(target(10, "ArrowDown"), 10);
});

test("moves to row and grid boundaries with Home and End", () => {
    assert.equal(target(4, "Home"), 3);
    assert.equal(target(4, "End"), 5);
    assert.equal(target(4, "Home", { controlKey: true }), 0);
    assert.equal(target(4, "End", { controlKey: true }), 11);
});

test("moves by the supplied visible page size and clamps to the same column", () => {
    assert.equal(target(7, "PageUp"), 1);
    assert.equal(target(4, "PageDown"), 10);
    assert.equal(target(1, "PageUp"), 1);
    assert.equal(target(10, "PageDown"), 10);
    assert.equal(target(4, "PageDown", { pageRowCount: 0 }), 7);
});

test("ignores unsupported control combinations and invalid models", () => {
    assert.equal(target(4, "ArrowRight", { controlKey: true }), undefined);
    assert.equal(target(0, "Home", { itemCount: 0 }), undefined);
    assert.equal(target(0, "Home", { columnCount: 0 }), undefined);
    assert.equal(target(12, "Home"), undefined);
});
