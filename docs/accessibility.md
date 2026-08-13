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
interactive events in column order.

Disabled navigation directions retain layout space but are hidden and cannot
receive focus. If `showControls={false}`, navigation controls are omitted.
Month and time-grid scroll regions use `tabIndex={0}` so keyboard users can
focus and scroll them without first reaching a child action.

The exact order of events and slots follows visual day/resource construction,
not chronological order across all columns. A complete roving-grid keyboard
model is planned under `A11Y-01`; it is not implemented today.

## Keyboard commands

| Context | Command | Behavior |
| --- | --- | --- |
| Navigation | `Enter` or `Space` | Activates the focused previous/next button. |
| Selectable event | `Enter` or `Space` | Activates the native button click and calls `onEventSelect`. |
| Editable-only event | `Enter` | Calls `onEventEdit`. |
| Selectable and editable event | `Shift+Enter` | Calls `onEventEdit`; ordinary activation remains selection. |
| Mouse event | Double click | Calls `onEventEdit` when allowed. |
| Selectable month day | `Enter` or `Space` | Calls `onSelectDay`. |
| Month overflow | `Enter` or `Space` | Calls `onShowMore`. |
| Selectable time slot | `Enter` or `Space` | Calls `onSlotSelect`. |
| Focused scroll region | browser/platform scrolling keys | Scrolls the calendar surface. |

Editable event roots receive `aria-keyshortcuts="Enter"` or
`aria-keyshortcuts="Shift+Enter"` as appropriate. `canEditEvent` may remove
editing behavior for one source event.

## Selection and editing feedback

Selection is controlled. Update `selectedEventIds`, `selectedDate`, or
`selectedRange` after a callback to expose the resulting visual state:

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
        onEventEdit={(event) => openAccessibleDialog(event)}
    />
</>
```

ChronoLaneJS does not announce application outcomes such as a saved edit,
failed persistence request, or rejected move. Use an application live region
and move focus intentionally when opening dialogs or changing views.

## Accessible names and messages

The `messages` registry owns all library-generated labels:

- previous/next navigation labels;
- month and time-grid names;
- selectable slot labels;
- interactive event labels;
- visible event time ranges;
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
- Interactive events are native buttons with complete event labels.
- Day and resource headers currently provide visible headings but do not yet
  implement the complete grid/row/column-header model planned in `A11Y-01`.

### Agenda

- Each visible day is a section with a heading.
- Interactive events are native buttons; non-interactive events are static.
- The empty renderer receives application-configurable text.

## Drag and drop limitation

Time-grid movement currently uses native HTML drag events. It is mouse-oriented
and does not provide an equivalent keyboard or reliable touch interaction.
This is an explicit `A11Y-02` roadmap item.

Applications must provide an alternative whenever `onEventDrop` is enabled.
The recommended current fallback is an edit action that exposes date, time,
and resource controls in an accessible dialog:

```tsx
<Calendar
    events={events}
    onEventEdit={(event) => openMoveDialog(event)}
    viewProps={{
        onEventDrop: applyProposedMove
    }}
/>
```

The dialog should validate the same rules as a drag, announce errors, return
focus to the invoking event, and update application state through the same
move operation. Do not describe native dragging as keyboard- or touch-accessible.

## Custom renderer responsibilities

Custom renderers replace markup but must preserve library behavior.

1. Spread `elementProps` onto the root element without dropping handlers,
   styles, `className`, `aria-label`, `aria-keyshortcuts`, or drag attributes.
2. Use a native `button` when `elementProps` contains click or double-click
   behavior. Set `type="button"` to avoid accidental form submission.
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
    const interactive = Boolean(elementProps.onClick || elementProps.onDoubleClick);
    const Root = interactive ? "button" : "div";

    return (
        <Root
            {...elementProps}
            type={interactive ? "button" : undefined}
            aria-pressed={interactive ? selected : undefined}
        >
            <strong>{event.title ?? "Untitled event"}</strong>
        </Root>
    );
}
```

`selected` is presentation state, not an instruction to override the supplied
accessible label. Add `aria-pressed` only when the event behaves as a toggle or
selection button in the application interaction model.

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
- [ ] touch users have an alternative to native drag-and-drop;
- [ ] at least one target screen reader is included in release testing.

The repository keeps automated Storybook accessibility checks, but automation
does not replace keyboard, screen-reader, high-contrast, zoom, and mobile-width
manual testing. The full built-in-view assistive-technology audit remains open
under `A11Y-03`.
