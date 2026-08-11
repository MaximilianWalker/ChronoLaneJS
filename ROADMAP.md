# ChronoLaneJS roadmap

This document is the canonical backlog for work that remains before
ChronoLaneJS can be considered stable. GitHub issues may be created for
individual work items, but they should reference the identifier here rather
than becoming a second roadmap.

Last reviewed: 2026-08-11

## Tracking rules

- `[P0]` blocks the first public npm release.
- `[P1]` should be completed before a stable `1.0.0` release.
- `[P2]` is valuable follow-up work that does not block the initial API.
- Check an item only after its implementation, tests, stories, public types,
  and documentation are complete.
- Breaking changes should be completed before the first release rather than
  preserved behind aliases or compatibility wrappers.
- The time-grid render body stays co-located with `TimeGridView`. Only genuine
  renderer extension points and cohesive domain modules should live in
  separate files.

## Release gates

- [ ] **[P0][REL-01] Complete every P0 correctness and API item.**
  - The first package must not publish contracts already known to be incorrect
    or redundant.
- [ ] **[P0][REL-02] Reserve and configure the `@chronolanejs` npm scope.**
  - Configure `@chronolanejs/react` as a public package.
  - Configure this GitHub repository as its trusted publisher.
  - Confirm the publishing identity has permission to use the scope.
- [ ] **[P0][REL-03] Verify the release workflow end to end.**
  - Create a release candidate, publish it with provenance, install the exact
    tarball in a clean consumer project, and verify package metadata.
  - Confirm that a failed validation prevents publication.
- [ ] **[P0][REL-04] Define the supported runtime matrix.**
  - Test every supported Node.js, React, and React DOM major version rather
    than validating only Node 24 and React 19.
  - Document supported evergreen browsers and any required polyfills.
- [ ] **[P1][REL-05] Establish versioning and release notes.**
  - Add a changelog and document the SemVer policy.
  - Define how prereleases, stable releases, and breaking changes are named.

## Correctness

- [ ] **[P0][TG-01] Preserve original event identity in time-grid callbacks.**
  - Selection and editing callbacks currently receive a clipped layout segment
    cast to `NormalizedCalendarEvent`.
  - Callbacks must receive the original event with its original boundaries and
    resource data.
  - Renderers should receive the original event and a separate visible segment.
- [ ] **[P0][TG-02] Replace the event-drop payload.**
  - Remove the partially stale `nextEvent` layout object.
  - Return the original event, next start and end, and explicit source and
    destination day/resource information.
  - Support drops between resource columns without losing the target resource.
  - Preserve the original duration when dragging a clipped multi-day segment.
- [ ] **[P0][TG-03] Decouple slot interaction from grid visibility.**
  - Slots must remain selectable and droppable regardless of visual grid-line
    styling.
  - Remove `showGrid`; keep the interaction layer mounted and style it through
    CSS.
- [ ] **[P0][DATE-01] Replace date-shaped time-of-day inputs.**
  - `minTime` and `maxTime` currently accept complete dates even though their
    date fields are ignored.
  - Introduce an explicit time-window contract such as `08:00` through `18:00`.
  - Define inclusive and exclusive boundaries and behavior across DST changes.
- [ ] **[P1][DATE-02] Normalize every externally supplied selection value.**
  - Apply the configured time zone consistently to selected ranges as well as
    events and view dates.
  - Reject invalid or reversed ranges with useful errors.
- [ ] **[P1][DATE-03] Define navigation boundary behavior.**
  - Test ranges that partially overlap `minDate` or `maxDate`.
  - Decide whether navigation is disabled, clamped, or allowed when a
    controlled date is outside the boundaries.
- [ ] **[P1][RANGE-01] Make range resolution and navigation one coherent
  contract.**
  - Remove the duplicate `navigationStep` locations.
  - Ensure callback-produced and non-contiguous ranges carry their navigation
    behavior after resolution.
  - Replace or remove `navigateDate` once the range strategy owns navigation.
- [ ] **[P1][RESOURCE-01] Use stable resource identifier types.**
  - Replace `unknown` resource identifiers with `CalendarResourceId` or a
    constrained generic identifier.
  - Detect missing or duplicate resource identifiers.
  - Document equality and multi-assignment behavior.
- [ ] **[P1][SCALE-01] Validate divider configuration explicitly.**
  - Invalid divider intervals currently fall back silently to the slot step.
  - Reject invalid configuration or document and test a deliberate fallback.

## Public API simplification

- [ ] **[P0][API-01] Make `CalendarProps` type-safe for built-in views.**
  - Replace `[key: string]: unknown` with a discriminated union keyed by
    `view`.
  - Reject misspelled and unsupported props at compile time.
  - Preserve a typed path for application-defined view registries.
- [ ] **[P0][API-02] Remove legacy prop paths.**
  - Remove `startDate`; use the standard `date` and `defaultDate` controlled
    and uncontrolled contract.
  - Remove `weekViewProps`; use the canonical view configuration path.
  - Remove the render-time state update used to synchronize `startDate`.
- [ ] **[P0][API-03] Keep one callback for each user action.**
  - [x] Replace `onEventClick` and `onSelectEvent` with the consistently
    ordered `onEventSelect(event, interaction)` callback.
  - Replace `onSlotClick` and `onSelectSlot` with one slot-selection callback.
  - Apply the same callback names and payloads across time-grid, month, and
    agenda views.
- [ ] **[P0][API-04] Make callback presence enable interactions.**
  - `onEventEdit` should enable editing without a second boolean.
  - `onEventDrop` should enable dragging without a second boolean.
  - Retain optional `canEditEvent` and `canDragEvent` predicates for
    event-specific restrictions.
- [ ] **[P1][API-05] Replace flat renderer props with a `components` contract.**
  - Group event, slot, background, column-header, day-header, empty-state, and
    navigation renderers by view.
  - Keep only renderer extension points that own meaningful markup.
- [ ] **[P1][API-06] Simplify renderer payloads.**
  - Slot renderers should receive a `slot`, selection state, and element props
    instead of fourteen duplicated fields.
  - Event renderers should receive the original event, visible segment,
    selection state, and element props instead of layout fields repeated both
    inside and outside `event`.
  - Column-header renderers should receive a column and its prepared title
    rather than duplicate day/resource/index fields.
- [ ] **[P1][API-07] Move visual dimensions to typed CSS variables.**
  - Remove `headerHeight`, `timeLabelWidth`, `cellWidth`, and `cellHeight`.
  - Replace `showGridLines` with styling or one semantic appearance variant.
  - Allow both `Calendar` and direct view components to receive typed
    `className` and `CalendarStyle`.
- [ ] **[P1][API-08] Group time-grid scale configuration.**
  - Replace the flat time props with a cohesive contract containing the time
    window, slot step, and label/divider cadence.
  - Keep slot granularity and label cadence distinct because they serve
    different purposes.
- [ ] **[P1][API-09] Group resource configuration.**
  - Keep resource items and their ID, title, and event-assignment accessors in
    one typed resource contract.
  - Preserve generic inference from the resource items.
- [ ] **[P1][API-10] Group formatting and messages.**
  - Replace `dayFormat`, `headerFormat`, and `formatHeader` with a coherent
    `formats` contract.
  - Replace individual previous/next labels and hardcoded text with a
    `messages` contract.
- [ ] **[P1][API-11] Remove the redundant resource preset.**
  - Resource columns are already a capability of every time-grid range.
  - Remove `ResourceView` and the `resource` view name; document resources on
    day, week, and custom time-grid ranges.
- [ ] **[P1][API-12] Audit the package export surface.**
  - Export only stable consumer contracts.
  - Keep layout-only fields such as rows, lanes, and column indexes private
    unless a renderer explicitly needs them.
  - Add an API report so accidental exports become reviewable changes.
- [ ] **[P2][API-13] Accept readonly consumer collections.**
  - Events, background events, resources, selected IDs, and explicit range
    days should accept readonly arrays without requiring copies.

## Time-grid implementation

- [ ] **[P1][ARCH-01] Reduce the co-located `TimeGridView` render body after the
  API cleanup.**
  - Do not recreate a separate generic `Grid.tsx`.
  - Remove the 29-value private handoff as the public contracts become smaller.
  - Extract only cohesive layers or hooks with clear ownership; do not create
    miscellaneous utility modules.
- [ ] **[P1][ARCH-02] Retire the current interaction helper module.**
  - Replace `moveEventToSlot` as part of the correct drop model.
  - Keep a helper only if it represents a stable, independently testable
    interaction rule.
- [ ] **[P1][ARCH-03] Share event interaction semantics across views.**
  - Month, agenda, and time-grid should not independently implement different
    click/edit/keyboard rules.
  - Keep view-specific markup separate while sharing one explicit interaction
    contract.
- [ ] **[P2][ARCH-04] Establish performance limits.**
  - Benchmark large event and resource sets.
  - Avoid repeated linear selected-ID lookups and unnecessary per-render
    regrouping.
  - Decide when resource or event virtualization becomes necessary.

## Localization and accessibility

- [ ] **[P0][I18N-01] Use locale-aware time formatting.**
  - Remove hardcoded `HH:mm` from visible and accessible text.
  - Provide locale-aware defaults and explicit formatter overrides.
- [ ] **[P0][I18N-02] Make all library-owned text configurable.**
  - Cover navigation, grid labels, slot labels, event ranges, empty states,
    and month overflow text.
  - Do not require replacing a renderer solely to translate a string.
- [ ] **[P1][A11Y-01] Define time-grid keyboard semantics.**
  - Document focus order and selection/edit shortcuts.
  - Add appropriate grid, row, column-header, and grid-cell semantics where
    they improve assistive-technology behavior.
  - Test the behavior with keyboard-only interaction.
- [ ] **[P1][A11Y-02] Replace native-only drag and drop.**
  - Native HTML drag events do not provide a complete touch or keyboard
    experience.
  - Support pointer, touch, and keyboard movement with equivalent callbacks
    and announcements.
- [ ] **[P1][A11Y-03] Audit every built-in view with assistive technology.**
  - Keep automated axe checks.
  - Add a documented manual pass for screen-reader names, focus visibility,
    high contrast, zoom, and reduced viewport widths.
- [ ] **[P2][I18N-03] Add right-to-left layout support.**
  - Define time-gutter, navigation, event-lane, and resource-column behavior
    for RTL documents.

## Testing and verification

- [ ] **[P0][TEST-01] Test public callback identity and payloads.**
  - Cover ordinary, clipped multi-day, overnight, and multi-resource events.
  - Assert that callbacks receive the original event rather than a layout
    segment.
- [ ] **[P0][TEST-02] Test drag and drop across days and resources.**
  - Cover duration preservation, destination resource data, cancellation, and
    invalid targets.
- [ ] **[P0][TEST-03] Add compile-time public API tests.**
  - Assert accepted prop combinations for every built-in view.
  - Assert that typos, wrong callback payloads, and view-incompatible props
    fail compilation.
- [ ] **[P1][TEST-04] Cover view state and navigation contracts.**
  - Controlled and uncontrolled dates.
  - Date and range change callbacks.
  - Min/max boundaries, non-contiguous ranges, and custom navigation.
- [ ] **[P1][TEST-05] Cover interaction enablement and renderer contracts.**
  - Callback-presence defaults and event-specific predicates.
  - Selection, editing, and slot interaction with customized renderers.
  - Interaction remains available when grid lines are visually hidden.
- [ ] **[P1][TEST-06] Test supported dependency combinations.**
  - Run CI against React 18 and 19 and every supported Node release.
  - Test production builds rather than only type compatibility.
- [ ] **[P1][TEST-07] Add clean consumer fixtures.**
  - Install the packed artifact into representative Vite and Next.js apps.
  - Verify ESM exports, declarations, CSS, the client directive, lazy locales,
    SSR import safety, and tree shaking.
- [ ] **[P1][TEST-08] Expand timezone and locale scenarios.**
  - Cover multiple positive and negative UTC offsets, DST boundaries,
    locale-specific week starts, 12/24-hour conventions, and lazy-load errors.
- [ ] **[P2][TEST-09] Add visual regression coverage.**
  - Use deterministic Storybook screenshots for overlap, clipping, responsive
    widths, custom themes, and RTL.
- [ ] **[P2][TEST-10] Define meaningful coverage thresholds.**
  - Measure core and interaction branches while avoiding a target that rewards
    low-value snapshot tests.

## Documentation and examples

- [ ] **[P0][DOC-01] Update documentation with the final pre-release API.**
  - Remove every legacy name and example in the same change as the refactor.
  - Document event identity, controlled state, time zones, ranges, resources,
    renderer contracts, and drop payloads.
- [ ] **[P1][DOC-02] Publish a complete API reference.**
  - Every public component, prop, callback payload, type, default, and thrown
    error should be discoverable from generated declarations or Storybook.
- [ ] **[P1][DOC-03] Document styling and theming.**
  - List supported CSS variables, stable class hooks, responsive behavior, and
    the boundary between library layout and consumer presentation.
- [ ] **[P1][DOC-04] Add runnable consumer examples.**
  - Include minimal Vite and Next.js examples.
  - Include controlled navigation, resources, localization, custom renderers,
    and interaction state updates.
- [ ] **[P1][DOC-05] Document accessibility behavior.**
  - Cover keyboard commands, focus behavior, messages, drag alternatives, and
    custom-renderer responsibilities.
- [ ] **[P2][DOC-06] Document deliberate non-goals.**
  - Decide and document ownership of recurrence expansion, persistence,
    fetching, application state, and design-system styling.

## Repository and maintenance

- [ ] **[P1][REPO-01] Add issue and pull-request templates.**
  - Include reproduction, browser/time-zone/locale information, accessibility
    impact, tests, stories, and the relevant roadmap identifier.
- [ ] **[P1][REPO-02] Automate dependency maintenance.**
  - Configure grouped dependency updates with CI validation and controlled
    major-version review.
- [ ] **[P1][REPO-03] Verify the security-reporting path.**
  - Confirm private vulnerability reporting is enabled and matches
    `SECURITY.md`.
  - Define how supported versions receive security fixes after releases exist.
- [ ] **[P2][REPO-04] Track package size.**
  - Record an initial ESM and CSS budget and fail CI on unexplained material
    regressions.
- [ ] **[P2][REPO-05] Define compatibility review for dependency upgrades.**
  - Date-fns, `@date-fns/tz`, React, TypeScript, Vite, and Storybook upgrades
    should include explicit public-API and consumer-fixture verification.

## Product decisions

- [ ] **[P1][DEC-01] Decide whether event resizing is in scope.**
  - If included, define mouse, touch, keyboard, minimum-duration, and
    cross-boundary behavior before exposing an API.
  - If excluded, clarify that `onEventEdit` launches application-owned editing.
- [ ] **[P1][DEC-02] Decide how all-day events appear in time-grid views.**
  - Either define a dedicated all-day region or document that consumers should
    use month/agenda views or a custom renderer.
- [ ] **[P2][DEC-03] Decide the large-resource strategy.**
  - Define practical limits and whether horizontal virtualization, grouped
    resources, or consumer-owned pagination belongs in the library.
