import AgendaView from "./views/agenda/AgendaView.js";
import MonthView from "./views/month/MonthView.js";
import DayView from "./views/time-grid/presets/DayView.js";
import WeekView from "./views/time-grid/presets/WeekView.js";
import TimeGridView from "./views/time-grid/TimeGridView.js";

/**
 * Immutable registry of the view names included with ChronoLaneJS.
 *
 * Pass a `views` entry with the same key to the root `Calendar` component to
 * override one.
 */
export const defaultCalendarViews = Object.freeze({
    agenda: AgendaView,
    day: DayView,
    month: MonthView,
    "time-grid": TimeGridView,
    week: WeekView
});
