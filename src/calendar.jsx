"use client";

import { Suspense } from "react";
import {
    DEFAULT_CALENDAR_LOCALE,
    readCalendarLocale
} from "./core/locale.js";
import { defaultCalendarViews } from "./view-registry.js";
import "./calendar.css";

const EMPTY_VIEWS = {};

const ResolvedCalendarView = ({
    ViewComponent,
    locale,
    sharedProps,
    defaultViewProps,
    legacyViewProps,
    viewProps,
    events,
    backgroundEvents,
    view
}) => (
    <ViewComponent
        {...sharedProps}
        {...defaultViewProps}
        {...legacyViewProps}
        {...viewProps}
        locale={readCalendarLocale(locale)}
        events={events}
        backgroundEvents={backgroundEvents}
        viewName={view}
    />
);

export default function Calendar({
    className,
    style,
    view = "week",
    views = EMPTY_VIEWS,
    viewProps = {},
    events = [],
    backgroundEvents = [],
    weekViewProps = {},
    locale = DEFAULT_CALENDAR_LOCALE,
    localeFallback = null,
    ...sharedProps
}) {
    const viewDefinition = views[view] ?? defaultCalendarViews[view];
    if (!viewDefinition) {
        throw new Error(`Calendar view "${view}" is not registered.`);
    }

    const ViewComponent = viewDefinition.component ?? viewDefinition;
    const defaultViewProps = viewDefinition.defaultProps ?? {};
    const legacyViewProps = view === "week" ? weekViewProps : {};

    return (
        <div
            className={`calendar ${className ?? ""}`.trim()}
            data-calendar-view={view}
            style={style}
        >
            <Suspense fallback={localeFallback}>
                <ResolvedCalendarView
                    ViewComponent={ViewComponent}
                    locale={locale}
                    sharedProps={sharedProps}
                    defaultViewProps={defaultViewProps}
                    legacyViewProps={legacyViewProps}
                    viewProps={viewProps}
                    events={events}
                    backgroundEvents={backgroundEvents}
                    view={view}
                />
            </Suspense>
        </div>
    );
}
