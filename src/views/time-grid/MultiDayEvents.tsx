import { useMemo } from "react";
import type { RefObject } from "react";

import type {
    CalendarEvent,
    CalendarResourceConfig
} from "../../types.js";
import type { EventRendering } from "./eventModel.js";
import type { MultiDayInteractions } from "./interactions/types.js";
import type { MultiDayEventLayout as Layout } from "./layout/multiDayEvents.js";
import type { LayoutColumn } from "./layout/types.js";
import MultiDayEvent from "./MultiDayEvent.js";
import { createMultiDayMovePreview } from "./preview.js";

interface MultiDayEventsProps<Event extends CalendarEvent, Resource> {
    layout: Layout<Event, Resource>;
    columns: LayoutColumn<Resource>[];
    resources?: CalendarResourceConfig<Event, Resource>;
    rendering: EventRendering<Event, Resource>;
    interactions: MultiDayInteractions<Event, Resource>;
    gridRef: RefObject<HTMLDivElement | null>;
}

export default function MultiDayEvents<
    Event extends CalendarEvent,
    Resource
>({
    layout,
    columns,
    resources,
    rendering,
    interactions,
    gridRef
}: MultiDayEventsProps<Event, Resource>) {
    const { messages, context } = rendering.text;
    const { move } = interactions;
    const movePreview = useMemo(() => createMultiDayMovePreview({
        move,
        columns,
        resources,
        text: rendering.text
    }), [columns, move, rendering.text, resources]);

    if (layout.events.length === 0) return null;

    return (
        <section
            className="time-grid-view_multi-day-region"
            aria-label={messages.multiDayRegionLabel({ view: context.view })}
        >
            <div
                role="status"
                aria-atomic="true"
                className="time-grid-view_live-region"
            >
                {movePreview?.announcement}
            </div>
            <div
                className="time-grid-view_multi-day-label"
                aria-hidden="true"
            >
                {messages.multiDayRegionLabel({ view: context.view })}
            </div>
            <div
                ref={gridRef}
                className="time-grid-view_multi-day-grid"
                style={{
                    gridTemplateRows: `repeat(${layout.laneCount}, minmax(30px, auto))`
                }}
            >
                {columns.map((column, columnIndex) => (
                    <div
                        key={`${column.key}-multi-day-column`}
                        aria-hidden="true"
                        className="time-grid-view_multi-day-column"
                        style={{
                            gridColumn: columnIndex + 1,
                            gridRow: `1 / ${layout.laneCount + 1}`
                        }}
                    />
                ))}
                {movePreview?.segments.map(({ key, style }) => (
                    <div
                        key={key}
                        aria-hidden="true"
                        className="time-grid-view_move-preview is-multi-day"
                        style={style}
                    />
                ))}
                {layout.events.map((segment) => {
                    const occurrenceKey = `${rendering.getEventKey(segment.event)}:dedicated:${segment.columnIndex}`;

                    return (
                        <MultiDayEvent
                            key={occurrenceKey}
                            occurrenceKey={occurrenceKey}
                            segment={segment}
                            columns={columns}
                            rendering={rendering}
                            interactions={interactions}
                        />
                    );
                })}
            </div>
        </section>
    );
}
