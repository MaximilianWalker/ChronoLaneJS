import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
    DayView,
    TimeGridView,
    WeekView
} from "../../src/index.js";
import type {
    CalendarEvent,
    CalendarResourceConfig
} from "../../src/index.js";
import {
    ANCHOR_DATE,
    MAX_TIME,
    MIN_TIME,
    resourceConfig,
    resourceEvents
} from "../fixtures.js";
import type {
    StoryEvent,
    StoryResource
} from "../fixtures.js";

interface Person {
    displayName: string;
    team: string;
    uuid: string;
}

interface AssignedEvent extends CalendarEvent {
    assigneeUuids: string[];
    id: string;
}

const people: Person[] = [
    { uuid: "ada", displayName: "Ada", team: "Platform" },
    { uuid: "grace", displayName: "Grace", team: "Design systems" }
];

const assignedEvents: AssignedEvent[] = [{
    id: "architecture",
    title: "Architecture review",
    start: "2026-09-14T09:00:00",
    end: "2026-09-14T10:30:00",
    color: "#2563eb",
    assigneeUuids: ["ada", "grace"]
}];

const assignedResourceConfig: CalendarResourceConfig<AssignedEvent, Person> = {
    items: people,
    getId: (person) => person.uuid,
    getTitle: (person) => `${person.displayName} · ${person.team}`,
    getEventIds: (event) => event.assigneeUuids
};

const StoryWeekView = WeekView<StoryEvent, StoryResource>;

const meta = {
    title: "Capabilities/Resource grouping",
    component: StoryWeekView,
    args: {
        date: ANCHOR_DATE,
        events: resourceEvents,
        resources: resourceConfig,
        groupBy: "day",
        minTime: MIN_TIME,
        maxTime: MAX_TIME,
        slotSizing: { width: 92 }
    },
    argTypes: {
        events: { control: false },
        resources: { control: false },
        groupBy: {
            control: "inline-radio",
            options: ["day", "resource"]
        }
    },
    parameters: {
        docs: {
            description: {
                component: "Resources subdivide time-grid ranges. Choose whether days or resources form the outer header groups."
            }
        }
    }
} satisfies Meta<typeof StoryWeekView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GroupedByDay: Story = {
    args: {
        slotSizing: { minWidth: 92 }
    },
    play: async ({ canvasElement }) => {
        const gridWrapper = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid-wrapper"
        );
        const grid = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid"
        );
        const header = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_header"
        );
        const headerCell = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_header-cell"
        );
        const timeLabels = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_time-labels"
        );
        const timeLabel = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_time-label"
        );
        const firstSlot = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_slot"
        );
        const primaryHeader = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_day-header.is-primary"
        );
        const firstEventTitle = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_event-title"
        );

        if (
            !gridWrapper
            || !grid
            || !header
            || !headerCell
            || !timeLabels
            || !timeLabel
            || !firstSlot
            || !primaryHeader
            || !firstEventTitle
        ) {
            throw new Error("The time-grid presentation did not render.");
        }

        const headerStyle = window.getComputedStyle(headerCell);
        const headerBoundaryStyle = window.getComputedStyle(header, "::before");
        const headerRowBoundaryStyle = window.getComputedStyle(header, "::after");
        const usesWebkitScrollbar = !navigator.userAgent.includes("Firefox");
        const scrollbarStyle = window.getComputedStyle(
            gridWrapper,
            "::-webkit-scrollbar"
        );
        const scrollbarThumbStyle = window.getComputedStyle(
            gridWrapper,
            "::-webkit-scrollbar-thumb"
        );
        const scrollbarTrackStyle = window.getComputedStyle(
            gridWrapper,
            "::-webkit-scrollbar-track"
        );
        const scrollbarCornerStyle = window.getComputedStyle(
            gridWrapper,
            "::-webkit-scrollbar-corner"
        );
        const scrollbarButtonStyle = window.getComputedStyle(
            gridWrapper,
            "::-webkit-scrollbar-button"
        );

        await expect(
            window.getComputedStyle(gridWrapper).borderRadius
        ).toBe("14px");
        await expect(gridWrapper.classList).toContain("calendar-scroll-region");
        if (usesWebkitScrollbar) {
            await expect(window.getComputedStyle(gridWrapper).scrollbarWidth).toBe("auto");
            await expect(window.getComputedStyle(gridWrapper).scrollbarColor).toBe("auto");
            await expect(scrollbarStyle.height).toBe("12px");
            await expect(scrollbarThumbStyle.backgroundClip).toBe("padding-box");
            await expect(
                Number.parseFloat(scrollbarThumbStyle.borderTopWidth)
            ).toBeGreaterThan(0);
            await expect(scrollbarTrackStyle.backgroundColor).toBe("rgba(0, 0, 0, 0)");
            await expect(scrollbarCornerStyle.backgroundColor).toBe("rgba(0, 0, 0, 0)");
            await expect(scrollbarButtonStyle.display).toBe("none");
        }
        await expect(headerStyle.borderLeftStyle).toBe("solid");
        await expect(
            Number.parseFloat(headerStyle.borderLeftWidth)
        ).toBeGreaterThan(0);
        await expect(headerBoundaryStyle.gridColumnStart).toBe("1");
        await expect(headerBoundaryStyle.gridColumnEnd).toBe("-1");
        await expect(headerBoundaryStyle.borderBottomStyle).toBe("solid");
        await expect(headerRowBoundaryStyle.gridColumnStart).toBe("1");
        await expect(headerRowBoundaryStyle.gridColumnEnd).toBe("-1");
        await expect(headerRowBoundaryStyle.borderBottomStyle).toBe("solid");
        await expect(window.getComputedStyle(firstSlot).borderTopWidth).toBe("0px");
        await expect(window.getComputedStyle(firstEventTitle).fontWeight).toBe("600");
        const columnWidths = window.getComputedStyle(grid).gridTemplateColumns
            .split(" ")
            .map(Number.parseFloat);
        const headerColumns = window.getComputedStyle(header).gridTemplateColumns
            .split(" ")
            .map(Number.parseFloat);
        await expect(columnWidths).toHaveLength(21);
        await expect(columnWidths.every((width) => width >= 92)).toBe(true);
        await expect(headerColumns.slice(1)).toEqual(columnWidths);
        await expect(primaryHeader.getBoundingClientRect().width).toBeCloseTo(
            columnWidths.slice(0, 3).reduce((total, width) => total + width, 0),
            0
        );
        await expect(gridWrapper.scrollWidth).toBeGreaterThan(
            gridWrapper.clientWidth
        );
        await expect(
            window.getComputedStyle(timeLabels).gridTemplateColumns
        ).toBe("64px");
        await expect(
            window.getComputedStyle(timeLabel).justifyContent
        ).toBe("center");
        await expect(
            canvasElement.querySelectorAll(
                ".time-grid-view_day-header.is-primary"
            )
        ).toHaveLength(7);
        await expect(
            canvasElement.querySelectorAll(
                ".time-grid-view_resource-header.is-secondary"
            )
        ).toHaveLength(21);
    }
};

export const GroupedByResource: Story = {
    args: { groupBy: "resource" },
    play: async ({ canvasElement }) => {
        await expect(
            canvasElement.querySelectorAll(
                ".time-grid-view_resource-header.is-primary"
            )
        ).toHaveLength(3);
        await expect(
            canvasElement.querySelectorAll(
                ".time-grid-view_day-header.is-secondary"
            )
        ).toHaveLength(21);
    }
};

export const DayRange: Story = {
    render: (args) => <DayView<StoryEvent, StoryResource> {...args} />,
    play: async ({ canvasElement }) => {
        const previousButton = canvasElement.querySelector<HTMLButtonElement>(
            '.calendar-view_navigation-button[aria-label="Previous day"]'
        );
        const nextButton = canvasElement.querySelector<HTMLButtonElement>(
            '.calendar-view_navigation-button[aria-label="Next day"]'
        );

        if (!previousButton || !nextButton) {
            throw new Error("The day navigation controls did not render.");
        }

        const grid = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid"
        );
        const view = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view"
        );
        const gridWrapper = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid-wrapper"
        );
        const timeLabels = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_time-labels"
        );

        if (!grid || !view || !gridWrapper || !timeLabels) {
            throw new Error("The day time grid did not render.");
        }

        const columnWidths = window.getComputedStyle(grid).gridTemplateColumns
            .split(" ")
            .map(Number.parseFloat);
        const wrapperStyle = window.getComputedStyle(gridWrapper);
        const frameWidth = Number.parseFloat(wrapperStyle.borderLeftWidth)
            + Number.parseFloat(wrapperStyle.borderRightWidth);

        await expect(
            previousButton.querySelector(".calendar-view_navigation-icon")
        ).toBeInTheDocument();
        await expect(
            nextButton.querySelector(".calendar-view_navigation-icon")
        ).toBeInTheDocument();
        await expect(window.getComputedStyle(previousButton).width).toBe("40px");
        await expect(window.getComputedStyle(previousButton).borderRadius).toBe("12px");
        await expect(columnWidths).toHaveLength(3);
        await expect(
            columnWidths.every((width) => Math.abs(width - 92) < 0.01)
        ).toBe(true);
        await expect(view.getBoundingClientRect().width).toBeCloseTo(
            timeLabels.getBoundingClientRect().width
                + grid.getBoundingClientRect().width
                + frameWidth,
            1
        );
        await expect(
            Math.abs(
                columnWidths.reduce((total, width) => total + width, 0)
                - grid.clientWidth
            )
        ).toBeLessThan(1);
    }
};

export const CustomLayoutOverrides: Story = {
    args: {
        className: "story-custom-time-grid-frame",
        style: {
            "--calendar-time-grid-header-row-height": "42px"
        }
    },
    render: (args) => <DayView<StoryEvent, StoryResource> {...args} />,
    play: async ({ canvasElement }) => {
        const view = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view"
        );
        const gridWrapper = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid-wrapper"
        );
        const header = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_header"
        );
        const timeLabels = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_time-labels"
        );
        const grid = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid"
        );

        if (!view || !gridWrapper || !header || !timeLabels || !grid) {
            throw new Error("The custom-layout time grid did not render.");
        }

        const wrapperStyle = window.getComputedStyle(gridWrapper);
        const frameWidth = Number.parseFloat(wrapperStyle.borderLeftWidth)
            + Number.parseFloat(wrapperStyle.borderRightWidth);

        await expect(wrapperStyle.borderLeftWidth).toBe("4px");
        await expect(wrapperStyle.borderRightWidth).toBe("4px");
        await expect(
            window.getComputedStyle(header).gridTemplateRows
        ).toBe("42px 42px");
        await expect(view.getBoundingClientRect().width).toBeCloseTo(
            timeLabels.getBoundingClientRect().width
                + grid.getBoundingClientRect().width
                + frameWidth,
            1
        );
    }
};

export const DualAxisOverflow: Story = {
    args: {
        slotSizing: {
            width: 120,
            height: 60
        }
    },
    render: (args) => (
        <div
            data-testid="resource-overflow-container"
            style={{ width: 620, height: 420 }}
        >
            <WeekView<StoryEvent, StoryResource> {...args} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const wrapper = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid-wrapper"
        );
        const header = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_header"
        );
        const grid = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid"
        );
        const primaryHeader = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_day-header.is-primary"
        );
        const firstSlot = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_slot"
        );

        if (!wrapper || !header || !grid || !primaryHeader || !firstSlot) {
            throw new Error("The dual-axis resource grid did not render.");
        }

        const assertTrackAlignment = async () => {
            const gridColumns = window.getComputedStyle(grid).gridTemplateColumns;
            const headerColumns = window.getComputedStyle(header).gridTemplateColumns
                .split(" ")
                .slice(1)
                .join(" ");

            await expect(headerColumns).toBe(gridColumns);
            await expect(
                Math.abs(
                    primaryHeader.getBoundingClientRect().left
                    - firstSlot.getBoundingClientRect().left
                )
            ).toBeLessThan(1);
        };

        await expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);
        await expect(wrapper.scrollHeight).toBeGreaterThan(wrapper.clientHeight);
        await assertTrackAlignment();

        wrapper.scrollLeft = 240;
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await expect(wrapper.scrollLeft).toBeGreaterThan(0);
        await assertTrackAlignment();
    }
};

export const MultipleAssignments: Story = {
    args: {
        events: resourceEvents.filter((event) => event.id === "shared-briefing")
    },
    render: (args) => <DayView<StoryEvent, StoryResource> {...args} />
};

export const WithoutResources: Story = {
    args: {
        events: [],
        resources: undefined,
        groupBy: "resource",
        slotSizing: undefined
    },
    play: async ({ canvasElement }) => {
        const grid = canvasElement.querySelector<HTMLElement>(
            ".time-grid-view_grid"
        );

        if (!grid) {
            throw new Error("The ungrouped time grid did not render.");
        }

        const columnWidths = window.getComputedStyle(grid).gridTemplateColumns
            .split(" ")
            .map(Number.parseFloat);

        await expect(
            canvasElement.querySelectorAll(".time-grid-view_resource-header")
        ).toHaveLength(0);
        await expect(
            canvasElement.querySelectorAll(".time-grid-view_day-header")
        ).toHaveLength(7);
        await expect(
            Math.abs(
                columnWidths.reduce((total, width) => total + width, 0)
                - grid.clientWidth
            )
        ).toBeLessThan(1);
    }
};

export const CustomTimeGridRange: Story = {
    render: (args) => (
        <TimeGridView<StoryEvent, StoryResource>
            {...args}
            range={[
                new Date(2026, 8, 14),
                new Date(2026, 8, 16),
                new Date(2026, 8, 18)
            ]}
            navigationStep={7}
        />
    )
};

export const CustomAccessors: Story = {
    render: ({ locale, timeZone }) => (
        <DayView
            date={ANCHOR_DATE}
            events={assignedEvents}
            resources={assignedResourceConfig}
            locale={locale}
            timeZone={timeZone}
            minTime={MIN_TIME}
            maxTime={MAX_TIME}
        />
    )
};
