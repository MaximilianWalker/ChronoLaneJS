import AgendaView from "./views/agenda/AgendaView.js";
import MonthView from "./views/month/MonthView.js";
import DayView from "./views/time-grid/presets/DayView.js";
import ResourceView from "./views/time-grid/presets/ResourceView.js";
import WeekView from "./views/time-grid/presets/WeekView.js";
import TimeGridView from "./views/time-grid/TimeGridView.js";

import type { ElementType } from "react";

/**
 * Immutable registry of the view names included with ChronoLane.
 *
 * Pass a `views` entry with the same key to the root `Calendar` component to
 * override one.
 */
export const defaultCalendarViews: Readonly<Record<string, ElementType>> = Object.freeze({
    agenda: AgendaView,
    day: DayView,
    month: MonthView,
    resource: ResourceView,
    "time-grid": TimeGridView,
    week: WeekView
});
