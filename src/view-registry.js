import AgendaView from "./views/agenda/view.jsx";
import MonthView from "./views/month/view.jsx";
import DayView from "./views/time-grid/presets/day.jsx";
import ResourceView from "./views/time-grid/presets/resource.jsx";
import WeekView from "./views/time-grid/presets/week.jsx";
import TimeGridView from "./views/time-grid/view.jsx";

export const defaultCalendarViews = Object.freeze({
    agenda: AgendaView,
    day: DayView,
    month: MonthView,
    resource: ResourceView,
    "time-grid": TimeGridView,
    week: WeekView
});
