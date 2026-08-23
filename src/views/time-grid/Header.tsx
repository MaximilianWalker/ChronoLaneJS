import type { ComponentType } from "react";

import type { ViewText } from "../../components/eventPresentation.js";
import type {
    CalendarEvent,
    CalendarResourceConfig
} from "../../types.js";
import { resolveCalendarResourceTitle } from "./resources.js";
import type {
    DayHeaderProps,
    ResourceHeaderProps
} from "./types.js";
import type {
    HeaderRows
} from "./layout/headers.js";

interface HeaderProps<
    Event extends CalendarEvent,
    Resource
> {
    rows: HeaderRows<Resource>;
    resources?: CalendarResourceConfig<Event, Resource>;
    dayRenderer: ComponentType<DayHeaderProps<Resource>>;
    resourceRenderer: ComponentType<ResourceHeaderProps<Resource>>;
    text: ViewText;
}

export default function Header<
    Event extends CalendarEvent,
    Resource
>({
    rows,
    resources,
    dayRenderer: DayHeaderRenderer,
    resourceRenderer: ResourceHeaderRenderer,
    text
}: HeaderProps<Event, Resource>) {
    const cells = [
        ...rows.primary.map((cell) => ({ cell, rowIndex: 0 })),
        ...rows.secondary.map((cell) => ({ cell, rowIndex: 1 }))
    ];
    const className = `time-grid-view_header${rows.secondary.length > 0
        ? " has-resource-headers"
        : ""}`;

    return (
        <div className={className}>
            {cells.map(({ cell, rowIndex }) => (
                <div
                    key={`${rowIndex}-${cell.key}`}
                    className={`time-grid-view_header-cell time-grid-view_${cell.kind}-header is-${rowIndex === 0
                        ? "primary"
                        : "secondary"}`}
                    style={{
                        gridColumn: `${cell.columnIndex + 2} / span ${cell.columns.length}`,
                        gridRow: rowIndex + 1
                    }}
                >
                    {cell.kind === "day"
                        ? (
                            <DayHeaderRenderer
                                day={cell.day}
                                columns={cell.columns}
                                title={text.formatters.dayHeader(
                                    cell.day,
                                    text.context
                                )}
                            />
                        )
                        : (
                            <ResourceHeaderRenderer
                                resource={cell.resource}
                                resourceId={cell.resourceId}
                                columns={cell.columns}
                                title={resolveCalendarResourceTitle(
                                    resources,
                                    cell.resource,
                                    cell.resourceId
                                )}
                            />
                        )}
                </div>
            ))}
        </div>
    );
}
