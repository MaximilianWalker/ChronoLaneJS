# ChronoLaneJS roadmap

This document is the canonical backlog for work that remains before
ChronoLaneJS can be considered stable. GitHub issues may be created for
individual work items, but they should reference the identifier here rather
than becoming a second roadmap.

Last reviewed: 2026-08-12

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
- [x] **[P0][REL-02] Reserve and configure the `@chronolanejs` npm scope.**
  - The free `@chronolanejs` npm organization owns the scope.
  - `@chronolanejs/react` declares public access and the npm registry in its
    package metadata.
  - The `maximilianwalker` publishing identity owns the organization and has
    package write access through its Developers team.
- [ ] **[P0][REL-03] Verify the release workflow end to end.**
  - After every remaining release gate passes, bootstrap the package with a
    `0.1.0-rc.0` release candidate under the npm `next` tag from an account
    protected by two-factor authentication.
  - Create the matching GitHub prerelease, configure
    `MaximilianWalker/ChronoLaneJS` and `publish.yml` as the package's trusted
    publisher, then enable the gated automatic release workflow.
  - Merge a release-bearing `dev` to `main` promotion and verify that
    semantic-release publishes stable `0.1.0` with provenance.
  - Install the exact tarball in a clean consumer project and verify package
    metadata.
  - Confirm that a failed validation prevents publication.
- [ ] **[P0][REL-04] Define the supported runtime matrix.**
  - Test every supported Node.js, React, and React DOM major version rather
    than validating only Node 24 and React 19.
  - Document supported evergreen browsers and any required polyfills.
- [x] **[P1][REL-05] Establish versioning and release notes.**
  - Semantic-release derives versions, tags, and GitHub release notes from
    Conventional Commit messages promoted from `dev` to `main`.
  - Fixes and performance changes publish patches, features publish minors,
    and breaking changes publish majors.
  - The bootstrap release candidate uses npm's `next` tag; automatic stable
    releases from `main` use npm's `latest` tag.

## Correctness

- [x] **[P0][TG-01] Preserve original event identity in time-grid callbacks.**
  - Layout segments retain their normalized source event.
  - Selection and editing callbacks receive the source with its unclipped
    boundaries and original resource data.
  - Renderers receive the source event and visible segment separately.
- [x] **[P0][TG-02] Return a complete event-drop payload.**
  - Drops return the source event, proposed start and end, and explicit source
    and destination day/resource positions.
  - Cross-resource drops retain the concrete destination resource.
  - Dragging a clipped segment preserves the source event's full duration.
- [x] **[P0][TG-03] Decouple slot interaction from grid visibility.**
  - Slots remain selectable and droppable regardless of visual grid-line
    styling.
  - The redundant `showGrid` prop is removed; the interaction layer is always
    mounted and grid-line presentation is owned by CSS.
- [x] **[P0][DATE-01] Replace date-shaped time-of-day inputs.**
  - `minTime` and `maxTime` accept strict wall-clock `HH:mm` values, with
    `24:00` reserved for the exclusive end of a complete day.
  - Layout uses minute offsets instead of artificial reference dates and keeps
    wall-clock rows stable across DST changes.
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
- [x] **[P1][SCALE-01] Validate label configuration explicitly.**
  - `labelInterval` must be an integer multiple of `slotDuration`.
  - Invalid configuration throws instead of silently falling back.

## Public API simplification

- [ ] **[P0][API-01] Make `CalendarProps` type-safe for built-in views.**
  - Replace `[key: string]: unknown` with a discriminated union keyed by
    `view`.
  - Reject misspelled and unsupported props at compile time.
  - Preserve a typed path for application-defined view registries.
- [x] **[P0][API-02] Use one controlled and uncontrolled configuration path.**
  - Navigation uses `date` and `defaultDate` consistently.
  - View-specific configuration uses `viewProps` consistently.
  - Uncontrolled view state is never updated during render.
- [x] **[P0][API-03] Keep one callback for each user action.**
  - Event selection uses `onEventSelect(event, interaction)`.
  - Slot selection uses `onSlotSelect(slot, interaction)`.
  - Callback naming and argument order are consistent across views.
- [x] **[P0][API-04] Make callback presence enable interactions.**
  - `onEventEdit` enables editing and `onEventDrop` enables dragging.
  - Optional `canEditEvent` and `canDragEvent` predicates restrict individual
    source events or visible drag segments.
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
- [x] **[P1][API-08] Keep time-grid scale configuration independently overridable.**
  - Flat primitive props avoid configuration-object merge rules and unstable
    object identities when callers override one value.
  - `slotDuration` and `labelInterval` replace the ambiguous `step` and
    presentation-oriented `dividerInterval` names.
- [ ] **[P1][API-09] Group resource configuration.**
  - Keep resource items and their ID, title, and event-assignment accessors in
    one typed resource contract.
  - Preserve generic inference from the resource items.
- [x] **[P1][API-10] Group formatting and messages.**
  - Complete `formatters` and `messages` registries replace scattered format
    strings, header callbacks, labels, and hardcoded text.
  - Exported immutable English defaults support explicit consumer-side
    extension without hidden partial-object merging.
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

- [x] **[P1][ARCH-01] Keep the time-grid render body owned by `TimeGridView`.**
  - The view renders its prepared layout directly without a private prop
    handoff or a generic grid wrapper.
  - Future extractions must own a cohesive responsibility, reduce coupling,
    and expose a smaller contract than the code they replace.
  - Pure layout behavior remains in independently testable domain modules.
- [x] **[P1][ARCH-02] Retire the generic interaction helper module.**
  - Event interaction predicates are evaluated where their behavior is owned.
  - Drop construction is a focused, independently tested domain operation.
- [x] **[P1][ARCH-03] Share event interaction semantics across views.**
  - One tested policy owns selection, editing, keyboard, and shortcut behavior
    for month, agenda, and time-grid renderers.
  - View-specific markup remains separate and receives cohesive standard React
    interaction props.
- [ ] **[P2][ARCH-04] Establish performance limits.**
  - Benchmark large event and resource sets.
  - Avoid repeated linear selected-ID lookups and unnecessary per-render
    regrouping.
  - Decide when resource or event virtualization becomes necessary.

## Localization and accessibility

- [x] **[P0][I18N-01] Use locale-aware time formatting.**
  - Remove hardcoded `HH:mm` from visible and accessible text.
  - Provide locale-aware defaults and explicit formatter overrides.
- [x] **[P0][I18N-02] Make all library-owned text configurable.**
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

- [x] **[P0][TEST-01] Test public callback identity and payloads.**
  - Browser stories cover ordinary, clipped multi-day, overnight, and
    multi-resource event callbacks.
  - Selection and editing assertions verify source boundaries and resource
    data rather than visible layout-segment values.
- [x] **[P0][TEST-02] Test drag and drop across days and resources.**
  - Unit tests cover duration preservation and cross-resource destinations.
  - Browser stories cover successful, cancelled, and invalid-target drops.
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
