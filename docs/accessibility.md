# Accessibility

ChronoLaneJS provides accessible names, semantic controls, keyboard event
actions, visible focus styles, reduced-motion styling, and renderer interaction
props. It does not make an application accessible automatically: data labels,
custom renderers, surrounding layout, and action outcomes remain consumer
responsibilities.

This page documents current behavior, including known limitations tracked in
the [roadmap](../ROADMAP.md#localization-and-accessibility).

## Focus order

With default renderers, browser tab order follows the DOM. Navigation comes
first. Agenda then exposes interactive events in day order. Month exposes its
focusable scroll region followed by each enabled day control, that day's
interactive events, and its overflow control. Time grid exposes its focusable
scroll region, selectable slots in time/column construction order, then
interactive events and any resize handles in column order.

Disabled navigation directions retain layout space as native disabled buttons,
receive `aria-hidden`, have no click handler, and are visually hidden. They
cannot receive focus or be activated, including through a custom navigation
renderer that spreads the supplied button props. If `showControls={false}`,
navigation controls are omitted.
Month and time-grid scroll regions use `tabIndex={0}` so keyboard users can
focus and scroll them without first reaching a child action.

The exact order of events and slots follows visual day/resource construction,
not chronological order across all columns. A complete roving-grid keyboard
model is planned under `A11Y-01`; it is not implemented today.

## Keyboard commands

| Context | Command | Behavior |
| --- | --- | --- |
| Navigation | `Enter` or `Space` | Activates the focused previous/next button. |
| Selectable event | `Space` | Calls `onEventSelect`. |
| Openable event | `Enter` | Calls `onEventOpen`. |
| Pointer event | Single click | Calls `onEventSelect`; a double-click still selects only once. |
| Pointer event | Double-click or double-tap | Calls `onEventOpen`. |
| Event resize handle | Arrow keys | Previews the adjacent valid `resizeStep` boundary. |
| Event resize handle | `Enter` or blur | Commits one `onEventResize` proposal after movement. |
| Event resize handle | `Escape` | Cancels without calling `onEventResize`. |
| Selectable month day | `Enter` or `Space` | Calls `onSelectDay`. |
| Month overflow | `Enter` or `Space` | Calls `onShowMore`. |
| Selectable time slot | `Enter` or `Space` | Calls `onSlotSelect`. |
| Focused scroll region | browser/platform scrolling keys | Scrolls the calendar surface. |

Focusable event roots receive `aria-keyshortcuts="Space"`, `"Enter"`, or both
according to their enabled semantics. `canSelectEvent` and `canOpenEvent` may
remove one action for one rendered occurrence without remapping the remaining
gesture. Consumer-provided `eventInteractions.ariaKeyShortcuts` is merged with
the semantic shortcuts.

## Selection and opening feedback

Selection is controlled. Update `selectedEventIds`, `selectedDate`, or
`selectedRange` after a callback to expose the resulting visual state:

Selected days and range boundaries are validated and normalized with the
configured `timeZone`. A selection range is half-open and must have a positive
duration; invalid, empty, or reversed values fail during rendering instead of
creating an ambiguous selected state.

```tsx
const [selectedEventIds, setSelectedEventIds] = useState<CalendarEventId[]>([]);
const [announcement, setAnnouncement] = useState("No event selected.");

<>
    <p aria-live="polite">{announcement}</p>
    <Calendar
        events={events}
        selectedEventIds={selectedEventIds}
        onEventSelect={(event) => {
            if (event.id != null) setSelectedEventIds([event.id]);
            setAnnouncement(`Selected ${event.title ?? "calendar event"}.`);
        }}
        onEventOpen={(event) => openAccessibleDialog(event)}
    />
</>
```

ChronoLaneJS does not announce application outcomes such as a saved change,
failed persistence request, or rejected move. Use an application live region
and move focus intentionally when opening dialogs or changing views.

## Accessible names and messages

The `messages` registry owns all library-generated labels:

- previous/next navigation labels;
- month and time-grid names;
- selectable slot labels;
- interactive event labels;
- visible event time ranges;
- event resize handles;
- agenda empty state;
- month overflow controls.

Default event labels combine title, formatted start/end dates and times, and
description. Provide meaningful event titles and descriptions, or override
`messages.eventLabel` when the domain needs another name.

```tsx
const messages = {
    ...defaultCalendarMessages,
    eventLabel: ({ title, startDate, startTime, endTime }) =>
        `${title ?? "Booking"}, ${startDate}, ${startTime} to ${endTime}`,
    slotLabel: ({ date, time }) => `Create booking on ${date} at ${time}`
};
```

The active `locale` supplies prepared date/time values but does not translate
application text. Translate the complete `messages` registry explicitly.

## View semantics

### Month

- The scroll surface has the configured month-grid accessible name.
- The calendar uses `role="grid"`, weekday headings use
  `role="columnheader"`, week containers use `role="row"`, and day cells use
  `role="gridcell"` with a formatted date label.
- Day-heading buttons are enabled only when `onSelectDay` exists.
- Background events are visual and non-interactive.

### Time grid

- The focusable scroll surface has the configured time-grid accessible name.
- Selectable slots are native buttons with formatted date/time labels.
- Interactive events are focusable event elements with complete labels and
  explicit Space/Enter keyboard handlers; they are not represented as buttons.
- Resize handles use vertical slider semantics with current, minimum, maximum,
  and formatted boundary values.
- Day and resource headers currently provide visible headings but do not yet
  implement the complete grid/row/column-header model planned in `A11Y-01`.

### Agenda

- Each visible day is a section with a heading.
- Interactive events are focusable event elements; non-interactive events are
  static.
- The empty renderer receives application-configurable text.

## Event resize behavior

Time-grid resize handles are independent siblings of the event renderer, so
operating a handle does not select, open, or drag the event. Pointer and touch
movement snaps to the configured `resizeStep` boundaries. Keyboard Arrow keys
move by the same boundaries even when visual slots are larger. The complete
proposed interval is shown immediately. The event always contains at least one
resize interval, including a shorter final interval when the configured time
window is uneven.

Only the chosen start or end edge changes. Resizing may cross visible days on
the same resource but never moves an event between resources. Pointer cancel
and Escape discard the preview; releasing the pointer, pressing Enter, or
leaving the keyboard handle commits one proposal. No movement produces no
callback. Background events never expose interaction or resize controls.

## Event movement behavior

Time-grid move controls are independent siblings of the event renderer, so
operating one does not select, open, or resize the event. Pointer and touch
movement target the slot under the pointer. Keyboard Arrow Up/Down selects the
previous or next time slot; Arrow Left/Right selects the adjacent visible day
or resource column. Each target immediately previews the complete event and is
announced with its prepared date, time, and resource label.

Pointer cancel and Escape discard the preview. Releasing the pointer, pressing
Enter, or leaving the keyboard control commits one `onEventDrop` proposal. No
movement produces no callback. Moving a clipped segment preserves the complete
source duration, and background events never expose movement controls.

## Custom renderer responsibilities

Custom renderers replace markup but must preserve library behavior.

1. Spread `elementProps` onto the root element without dropping handlers,
   styles, `className`, `aria-label`, or `aria-keyshortcuts`.
2. Keep event roots as event/content elements. ChronoLaneJS supplies explicit
   pointer and keyboard behavior; do not recast every event as a native button.
3. Keep the supplied accessible name unless the replacement provides an
   equivalent or better name.
4. Preserve visible focus indication and selected-state contrast.
5. Do not attach interaction only to a nested pointer target.
6. Keep heading renderers concise; do not remove information needed to
   distinguish day/resource groups.
7. If a renderer introduces controls inside an event, define an intentional
   focus and event-propagation policy.

```tsx
function AccessibleEvent({ event, selected, elementProps }: TimeGridEventProps) {
    return (
        <div
            {...elementProps}
            data-selected={selected || undefined}
        >
            <strong>{event.title ?? "Untitled event"}</strong>
        </div>
    );
}
```

`selected` is presentation state, not an instruction to override the supplied
accessible label or add button semantics.

## Visual accessibility

- Default interactive elements use `:focus-visible` outlines.
- Navigation animation is disabled under `prefers-reduced-motion: reduce`.
- Scroll containers preserve native platform scrollbars.
- Event `color` alone should not communicate status; include text or another
  perceivable cue in event data/renderers.
- Application CSS must retain sufficient text, border, selected, hover, and
  focus contrast.
- Fixed sizes and minimum columns should be tested at 200% and 400% zoom.

## Consumer verification checklist

For every application integration and custom renderer, verify:

- [ ] all actions are reachable and operable without a pointer;
- [ ] focus is visible, never trapped, and restored after dialogs;
- [ ] event, slot, navigation, and overflow names are meaningful;
- [ ] selected and disabled states are perceivable without color alone;
- [ ] live updates and errors are announced;
- [ ] the schedule remains usable at 200% zoom and narrow widths;
- [ ] high-contrast/forced-color modes retain boundaries and focus;
- [ ] reduced-motion preference does not introduce unexpected animation;
- [ ] pointer, touch, and keyboard event movement reaches equivalent targets;
- [ ] at least one target screen reader is included in release testing.

The repository keeps automated Storybook accessibility checks, but automation
does not replace keyboard, screen-reader, high-contrast, zoom, and mobile-width
manual testing. The full built-in-view assistive-technology audit remains open
under `A11Y-03`.
