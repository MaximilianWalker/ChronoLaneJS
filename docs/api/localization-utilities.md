# Localization and utilities

This reference covers locale and message registries, date and range helpers,
and public errors. Start with the [API overview](../api.md) to
find another contract area.

## Localization contracts

<!-- api:CalendarLocale DEFAULT_CALENDAR_LOCALE calendarLocaleNames CalendarFormatContext CalendarFormatters defaultCalendarFormatters CalendarMessageContext CalendarNavigationMessageContext CalendarSlotMessageContext CalendarEventMessageContext CalendarEventMoveHandleMessageContext CalendarEventMoveTargetMessageContext CalendarEventResizeHandleMessageContext CalendarTimeRangeMessageContext CalendarMoreEventsMessageContext CalendarMessages defaultCalendarMessages -->
<!-- props:CalendarFormatContext locale view -->
<!-- props:CalendarFormatters time date weekday dayHeader rangeHeader -->
<!-- props:CalendarMessageContext view -->
<!-- props:CalendarNavigationMessageContext range -->
<!-- props:CalendarSlotMessageContext date time -->
<!-- props:CalendarEventMessageContext title description startDate startTime endDate endTime -->
<!-- props:CalendarEventMoveHandleMessageContext title -->
<!-- props:CalendarEventMoveTargetMessageContext date time resource -->
<!-- props:CalendarEventResizeHandleMessageContext edge title date time -->
<!-- props:CalendarTimeRangeMessageContext startTime endTime -->
<!-- props:CalendarMoreEventsMessageContext count date -->
<!-- props:CalendarMessages previous next timeGridLabel multiDayRegionLabel monthGridLabel slotLabel eventLabel eventMoveHandle eventMoveTarget eventResizeHandle timeRange agendaEmpty moreEvents -->

`CalendarLocale` is a supported name or date-fns `Locale`. The constant
`DEFAULT_CALENDAR_LOCALE` is `"en-US"`. `calendarLocaleNames` is the frozen,
sorted list accepted by the built-in lazy registry.

### `CalendarFormatters`

Every callback receives `{ locale, view }`.

| Formatter | Input | Default result |
| --- | --- | --- |
| `time` | one date | locale short time (`9:00 AM`) |
| `date` | one date | locale full date |
| `weekday` | one date | abbreviated weekday |
| `dayHeader` | one date | view-specific day number/full date/weekday form |
| `rangeHeader` | resolved range | view-specific month, date, or date-span React content |

The registry is complete and immutable. Extend it outside render:

```tsx
const formatters = {
    ...defaultCalendarFormatters,
    time: (date: Date, { locale }: CalendarFormatContext) =>
        format(date, "HH:mm", { locale })
};
```

### `CalendarMessages`

| Message | Context fields | Purpose | Example result |
| --- | --- | --- | --- |
| `previous`, `next` | `view`, `range` | Navigation accessible label | `"Next week"` |
| `timeGridLabel`, `monthGridLabel` | `view` | Scrollable grid accessible name | `"Week calendar"` |
| `multiDayRegionLabel` | `view` | Visible and accessible dedicated-region label | `"Multi-day events"` |
| `slotLabel` | `view`, prepared `date`, prepared `time` | Selectable slot label | `"Monday, September 14 at 9:00 AM"` |
| `eventLabel` | `view`, optional title/description, prepared start/end date/time | Event details tooltip and interactive label | `"Planning, Monday, 9:00 AM to 10:00 AM"` |
| `eventMoveHandle` | `view`, optional title | Accessible movement description for a movable event | `"Move Planning"` |
| `eventMoveTarget` | `view`, optional title/resource, prepared date/time | Live movement destination announcement | `"Move Planning to Tuesday, 10:00 AM, Studio"` |
| `eventResizeHandle` | `view`, edge, optional title, prepared date/time | Accessible resize-handle label | `"Resize end of Planning, Monday at 10:00 AM"` |
| `timeRange` | `view`, prepared start/end time | Visible event time text | `"9:00 AM – 10:00 AM"` |
| `agendaEmpty` | `view`, `range` | Agenda empty state | `"No events in this range."` |
| `moreEvents` | `view`, `count`, prepared `date` | Month overflow control | `"Show 3 more events for September 14"` |

The default registry is immutable English application text. Locale-specific
date values are already prepared before message functions run.

## Date functions

<!-- api:parseCalendarDate asCalendarDate toCalendarTimeZone calendarDateFromTimestamp -->

| Function | Signature summary | Result and errors | Example |
| --- | --- | --- | --- |
| `parseCalendarDate` | `(CalendarDateInput) => Date` | Clones/parses; invalid input returns an invalid `Date`. | `parseCalendarDate("2026-09-14")` |
| `asCalendarDate` | `(input, timeZone?) => Date` | Parses, validates, and attaches a wall-clock zone. Throws `TypeError` when invalid. | `asCalendarDate("2026-09-14", "UTC")` |
| `toCalendarTimeZone` | `(date, timeZone?) => Date` | Attaches an IANA zone while preserving visible fields; does not preserve the instant. | `toCalendarTimeZone(new Date(2026, 8, 14, 9), "Asia/Tokyo")` |
| `calendarDateFromTimestamp` | `(milliseconds, timeZone?) => Date` | Preserves the instant and derives visible fields in the zone. | `calendarDateFromTimestamp(Date.now(), "UTC")` |

Field-level date setters are implementation details. Consumers should pass
`CalendarDateInput` values to components or use the normalization functions
above when a concrete calendar `Date` is required.

## Locale functions

<!-- api:resolveCalendarLocaleName loadCalendarLocale preloadCalendarLocale -->

| Function | Behavior | Errors | Example |
| --- | --- | --- | --- |
| `resolveCalendarLocaleName` | Canonicalizes aliases, scripts, regions, then language fallbacks to one registry key. | `TypeError` for empty/non-string; `RangeError` for invalid or unsupported names. | `resolveCalendarLocaleName("en") // "en-US"` |
| `loadCalendarLocale` | Loads and caches a supported named locale, or validates and resolves an object immediately. Concurrent loads share a promise. | `TypeError`, `RangeError`, or `Error` when dynamic import fails. | `await loadCalendarLocale("en-CA")` |
| `preloadCalendarLocale` | Alias of `loadCalendarLocale`, named for pre-render use. | same as above | `await preloadCalendarLocale("en-AU")` |

## Range function

<!-- api:resolveCalendarRange -->

| Function | Behavior | Errors | Example |
| --- | --- | --- | --- |
| `resolveCalendarRange` | Resolves days and navigation into one `ResolvedCalendarRange`. The result exposes `start`, `end`, `days`, and `navigate(direction)`. | `TypeError` for unsupported/ambiguous definitions or invalid custom navigation; `RangeError` for empty/invalid ranges or steps. | `resolveCalendarRange("week", anchor, { weekStartsOn: 1 })` |

Range construction, bounds extraction, and movement helpers stay private.
Consumers describe ranges with `CalendarRangeDefinition`; custom view code can
call `resolveCalendarRange` when it needs the normalized days and navigation
contract outside a built-in view.

## Error reference

| Area | Invalid input | Error |
| --- | --- | --- |
| Root view | unregistered `view` | `Error` |
| Dates/events | invalid date input or event boundary | `TypeError` |
| Navigation boundaries | invalid `minDate`/`maxDate`, or `minDate` after `maxDate` | `TypeError` or `RangeError` |
| Selection | invalid selected day/range boundary, or an end not after its start | `TypeError` or `RangeError` |
| Locale | empty/malformed object/name | `TypeError` or `RangeError` |
| Locale loading | failed dynamic module | `Error` with the original cause |
| Ranges | invalid/ambiguous definition, boundary, count, navigation strategy/result, direction, or empty result | `TypeError` or `RangeError` |
| Resources | missing/invalid/duplicate IDs or non-array assignments | `TypeError` or `RangeError` |
| Time window | malformed `HH:mm` or `maxTime <= minTime` | `TypeError` or `RangeError` |
| Time scale | non-positive slot duration or incompatible label interval | `RangeError` |
| Slot sizing | conflicting, non-finite, negative, or zero fixed size | `RangeError` |
| Grouping | value other than `day` or `resource` at runtime | `TypeError` |

Errors are raised during helper invocation or component render. Error messages
are useful diagnostics, but the error class and documented validity rules are
the stable contract.
