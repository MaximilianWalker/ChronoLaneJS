import type { Meta } from "@storybook/react-vite";
import { fn } from "storybook/test";

import type { TimeGridViewProps } from "../../../src/index.js";
import {
    CustomSlot,
    CustomTimeGridEvent,
    InteractionHarness
} from "../../harnesses.js";
import type { StoryEvent, StoryResource } from "../../fixtures.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    basicEvents
} from "../../fixtures.js";

export const CUSTOM_RENDERER_COMPONENTS = {
    event: CustomTimeGridEvent,
    slot: CustomSlot
};

export const TIME_GRID_VIEW_PROPS = {
    minTime: MIN_TIME,
    maxTime: MAX_TIME,
    onEventDrop: fn(),
    onEventResize: fn(),
    onSlotSelect: fn()
} as const;

export const INTERACTION_META = {
    component: InteractionHarness,
    args: {
        view: "day",
        date: ANCHOR_DATE,
        events: basicEvents,
        viewProps: TIME_GRID_VIEW_PROPS,
        onEventOpen: fn(),
        onEventSelect: fn()
    },
    argTypes: {
        canOpenEvent: { control: false },
        events: { control: false },
        onEventOpen: { control: false },
        onEventSelect: { control: false },
        viewProps: { control: false }
    }
} satisfies Meta<typeof InteractionHarness>;

export const getTimeGridViewProps = (args: { viewProps?: unknown }) => (
    args.viewProps as Partial<TimeGridViewProps<StoryEvent, StoryResource>> | undefined
);

const EVENT_SELECTOR = ".time-grid-view_event, .agenda-view_event, .month-view_event";

export const getEventElements = (
    canvasElement: HTMLElement,
    title: string
): HTMLElement[] => [...canvasElement.querySelectorAll<HTMLElement>(EVENT_SELECTOR)].filter(
    (element) => element.getAttribute("aria-label")?.includes(title)
        || element.textContent?.includes(title)
);

export const getEventElement = (
    canvasElement: HTMLElement,
    title: string
): HTMLElement => {
    const [element] = getEventElements(canvasElement, title);
    if (!element) throw new Error(`Could not find the rendered event "${title}".`);
    return element;
};
