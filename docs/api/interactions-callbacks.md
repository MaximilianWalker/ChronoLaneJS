# Interactions and callbacks

This reference covers time-grid occurrence data and the payloads emitted by
movement and resize callbacks. The [interaction guide](../interactions.md)
explains how to apply these contracts in a controlled calendar.

## Event interaction context

<!-- api:CalendarEventOccurrence CalendarEventInteractionContext CalendarEventInteractions -->
<!-- props:CalendarEventOccurrence day resource resourceId -->
<!-- props:CalendarEventInteractionContext view occurrence -->
<!-- props:CalendarEventInteractions onClick onDoubleClick onContextMenu onKeyDown ariaKeyShortcuts -->

`CalendarEventInteractionContext<Resource>` identifies the view and the exact
rendered occurrence. Its `occurrence` contains normalized `day`, concrete
`resource` (or `null`), and stable `resourceId` (or `null`). This matters when
one source event appears on several days or resources.

Raw `onClick`, `onDoubleClick`, `onContextMenu`, and `onKeyDown` callbacks each
receive `(event, interaction, context)`. They observe the browser's real event
sequence: for example, a double-click produces two raw clicks and one raw
double-click while semantic selection runs once and semantic opening runs once.
`ariaKeyShortcuts` accepts a string or `(event, context) => string`; its tokens
are deduplicated with the built-in Space/Enter shortcuts.

## Time-grid interaction payloads

<!-- api:TimeGridColumn TimeGridSlot TimeGridEventSegment TimeGridEventPosition TimeGridEventDrop TimeGridEventResizeEdge TimeGridEventResize -->
<!-- props:TimeGridColumn day resource resourceId -->
<!-- props:TimeGridSlot start end duration day resource resourceId -->
<!-- props:TimeGridEventSegment layout start end day resource resourceId -->
<!-- props:TimeGridEventPosition day resource resourceId -->
<!-- props:TimeGridEventDrop event start end source destination -->
<!-- props:TimeGridEventResize event edge start end source -->

### `TimeGridColumn<Resource>`

| Field | Meaning | Example |
| --- | --- | --- |
| `day` | Normalized visible day represented by the column. | `new Date(2026, 8, 14)` |
| `resource` | Concrete resource item, or `null` when the grid has no resources. | `{ id: "studio", name: "Studio" }` |
| `resourceId` | Stable resource identity, or `null` without resources. | `"studio"` |

### `TimeGridSlot<Resource>`

| Field | Meaning | Example |
| --- | --- | --- |
| `start`, `end` | Half-open wall-clock interval. | `09:00` through `09:30` on the owning day |
| `duration` | Actual minutes; the last uneven slot may be shorter. | `30` |
| `day` | Normalized day owning the slot. | `new Date(2026, 8, 14)` |
| `resource` | Concrete resource item, or `null` without resources. | `{ id: "studio", name: "Studio" }` |
| `resourceId` | Stable resource identity, or `null` without resources. | `"studio"` |

### `TimeGridEventSegment<Resource>`

| Field | Meaning | Example |
| --- | --- | --- |
| `layout` | Region rendering the segment: `"timed"` for a single day/resource column or `"dedicated"` for an aligned multi-day bar. | `"dedicated"` |
| `start`, `end` | Visible half-open interval. Timed segments are clipped to one day and the time window; dedicated segments are clipped to their contiguous visible day span. | `new Date(2026, 8, 14, 14)` through `new Date(2026, 8, 16, 11)` |
| `day` | Normalized owning day for a timed segment or first visible day for a dedicated segment. | `new Date(2026, 8, 14)` |
| `resource` | Concrete resource column item, or `null` without resources. | `{ id: "studio", name: "Studio" }` |
| `resourceId` | Stable resource column identity, or `null` without resources. | `"studio"` |

The complete normalized source event is the separate `event` renderer/callback
argument. CSS rows, overlap lanes, generated keys, and flattened column indexes
are private; the library supplies their effect through `elementProps`.

### Export-surface migration

| Removed public contract | Replacement |
| --- | --- |
| `TimeGridEventLayout` and segment row/lane/index fields | Use `TimeGridEventSegment` for semantic interval/resource data and spread the positioned `elementProps` in renderers. |
| `TimeGridColumn.key`, `dayIndex`, and `resourceIndex` | Use `day`, `resource`, and `resourceId`; derive application-specific ordering from the `columns` array only when needed. |
| `TimeGridSlot.key`, indexes, and divider state | Use `start`, `end`, `duration`, `day`, `resource`, and `resourceId`; slot placement and classes remain library-owned. |
| `setDate` and `setTime` package exports | Pass `CalendarDateInput`, use the public normalization functions, or use the corresponding date-fns operation directly. |
| `createCalendarRange`, `getCalendarRangeBounds`, and `moveCalendarDate` package exports | Describe the range with `CalendarRangeDefinition`; call `resolveCalendarRange` when custom view code needs resolved days/navigation. |

### `TimeGridEventPosition<Resource>`

A shared `{ day, resource, resourceId }` position describes where movement or
resize originates and, for movement, where it lands.

### `TimeGridEventDrop<Event, Resource>`

`event` is the normalized source. `start` and `end` are proposed complete
boundaries. `source` and `destination` each contain `day`, concrete `resource`,
and `resourceId`:

```ts
{
    event: planning,
    start: new Date(2026, 8, 15, 11, 0),
    end: new Date(2026, 8, 15, 12, 15),
    source: { day: monday, resource: studio, resourceId: "studio" },
    destination: { day: tuesday, resource: workshop, resourceId: "workshop" }
}
```

### `TimeGridEventResize<Event, Resource>`

`edge` is `"start" | "end"`. `start` and `end` are the proposed complete
source boundaries. `source` identifies the rendered day/resource occurrence;
resizing never changes that resource.

```ts
{
    event: planning,
    edge: "end",
    start: new Date(2026, 8, 14, 9, 0),
    end: new Date(2026, 8, 14, 10, 30),
    source: { day: monday, resource: studio, resourceId: "studio" }
}
```
