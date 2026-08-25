# Renderer contracts

This reference covers the exact props and element contracts supplied to custom
calendar renderers. The [custom renderer guide](../renderers.md) explains
composition and ownership responsibilities.

## Extension points

Renderers receive prepared data and `elementProps`. Spread `elementProps` onto
the semantic root unchanged before adding application props. It carries class,
style, ARIA labeling, semantic/raw event handlers, and keyboard behavior owned
by the library.

<!-- api:CalendarRendererElementProps CalendarComponents CalendarNavigationButton CalendarNavigationButtonProps TimeGridComponents TimeGridSlotProps TimeGridEventProps TimeGridBackgroundEventProps TimeGridDayHeaderProps TimeGridResourceHeaderProps -->
<!-- props:CalendarRendererElementProps className style -->
<!-- props:CalendarComponents navigation -->
<!-- props:CalendarNavigationButtonProps type -->
<!-- props:TimeGridComponents event slot backgroundEvent dayHeader resourceHeader -->
<!-- props:TimeGridSlotProps slot selected elementProps -->
<!-- props:TimeGridEventProps event segment selected elementProps -->
<!-- props:TimeGridBackgroundEventProps event segment elementProps -->
<!-- props:TimeGridDayHeaderProps day columns title -->
<!-- props:TimeGridResourceHeaderProps resource resourceId columns title -->
<!-- props:AgendaComponents event dayHeader empty -->
<!-- props:AgendaDayHeaderProps day label -->
<!-- props:AgendaEventProps event timeLabel selected elementProps -->
<!-- props:AgendaEmptyProps message -->
<!-- props:MonthComponents event dayHeader -->
<!-- props:MonthDayHeaderProps day label outsideMonth -->
<!-- props:MonthEventProps event day timeLabel selected elementProps -->

`CalendarRendererElementProps` always includes `className` and `style`, and may
include native HTML attributes such as `title`, `aria-label`, `onClick`, and
`onKeyDown`. Foreground event renderers receive a localized `title` containing
the event title, description, and complete start/end date and time details.
For example, an interactive event may receive
`{ className: "calendar-event is-selected", style: { "--color": "#2563eb" },
"aria-label": "Planning, Monday, 9:00 AM to 10:00 AM", onClick }`.

| Renderer | Payload meaning | Example data |
| --- | --- | --- |
| shared `navigation` | Native button props plus `type: "prev" \| "next"`; preserve labels, disabled visibility, and click handlers. | `{ type: "next", "aria-label": "Next week", onClick }` |
| agenda `event` | Complete normalized `event`, prepared `timeLabel`, selection state, and root `elementProps`. | `{ event: planning, timeLabel: "9:00 AM – 10:00 AM", selected: true, elementProps }` |
| agenda `dayHeader` | Normalized `day` and prepared `label`. | `{ day: monday, label: "Monday, September 14" }` |
| agenda `empty` | Prepared empty-state message. | `{ message: "No events in this range." }` |
| month `event` | Complete normalized `event`, represented `day`, prepared `timeLabel`, selection state, and root props. | `{ event: planning, day: monday, timeLabel: "9:00 AM", selected: false, elementProps }` |
| month `dayHeader` | Normalized `day`, prepared `label`, and whether it lies outside the active month. | `{ day: monday, label: "14", outsideMonth: false }` |
| time-grid `event` | Complete normalized `event`, semantic visible `segment`, selection state, and positioned root props. | `{ event: planning, segment: { start: nine, end: ten, day: monday, resource: studio, resourceId: "studio" }, selected: true, elementProps }` |
| time-grid `slot` | Complete slot, range-overlap selection state, and root props. | `{ slot: { start: nine, end: nineThirty, duration: 30, resourceId: "studio" }, selected: false, elementProps }` |
| time-grid `backgroundEvent` | Complete normalized event, semantic visible segment, and non-interactive positioned root props. | `{ event: lunchClosure, segment: { start: noon, end: one, day: monday, resource: studio, resourceId: "studio" }, elementProps }` |
| time-grid `dayHeader` | Normalized `day`, covered semantic columns, and prepared string `title`. | `{ day: monday, columns: [{ day: monday, resource: studio, resourceId: "studio" }], title: "Mon 14" }` |
| time-grid `resourceHeader` | Concrete resource, its identity, covered semantic columns, and prepared React `title`. | `{ resource: studio, resourceId: "studio", columns: [studioColumn], title: "Studio" }` |

```tsx
import type { TimeGridEventProps } from "@chronolanejs/react";

function MeetingEvent({ event, segment, selected, elementProps }: TimeGridEventProps<Meeting, Room>) {
    return (
        <div
            {...elementProps}
            data-resource-id={segment.resourceId ?? undefined}
            data-selected={selected || undefined}
        >
            <strong>{event.title}</strong>
            <span>{event.owner.name}</span>
        </div>
    );
}
```

See [Accessibility](../accessibility.md#custom-renderer-responsibilities) before
replacing interactive renderers.
