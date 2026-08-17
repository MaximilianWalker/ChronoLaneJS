# ChronoLaneJS roadmap

This document is the canonical backlog for work that remains before
ChronoLaneJS can be considered stable. GitHub issues may be created for
individual work items, but they should reference the identifier here rather
than becoming a second roadmap.

Last reviewed: 2026-08-16

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

- [x] **[P0][REL-01] Complete every P0 correctness and API item.**
  - The first package must not publish contracts already known to be incorrect
    or redundant.
- [x] **[P0][REL-02] Reserve and configure the `@chronolanejs` npm scope.**
  - The free `@chronolanejs` npm organization owns the scope.
  - `@chronolanejs/react` declares public access and the npm registry in its
    package metadata.
  - The `maximilianwalker` publishing identity owns the organization and has
    package write access through its Developers team.
- [x] **[P0][REL-03] Verify the release workflow end to end.**
  - `0.1.0-rc.0` was published under npm's `next` tag with a matching GitHub
    prerelease from the two-factor-protected publishing account.
  - `MaximilianWalker/ChronoLaneJS` and `publish.yml` are configured as the npm
    trusted publisher, and the gated automatic release workflow is enabled.
  - A release-bearing `dev` promotion published `1.0.0` through
    semantic-release with provenance. The major version correctly reflected
    the breaking commits included in the initial stable promotion; a later
    promotion published `1.0.1` through the same path.
  - `npm run examples:check` creates one exact tarball and verifies its files,
    metadata, runtime exports, declarations, and styles from clean consumers.
  - `npm run release:verify` enforces fail-closed validation ordering before
    semantic-release can publish.
- [x] **[P0][REL-04] Define the supported runtime matrix.**
  - CI tests matching React and React DOM 18.2 and 19.0 releases against the
    supported Node 22, 24, and 26 lines, including a production package build
    and server-render verification for every combination.
  - Chrome and Edge 111+, Firefox 114+, and Safari and iOS Safari 16.4+ are
    supported without polyfills; older and incomplete-Intl runtimes are not.
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
  - Selection and opening callbacks receive the source with its unclipped
    boundaries, plus the rendered day/resource occurrence.
  - Renderers receive the source event and visible segment separately.
- [x] **[P0][TG-02] Return a complete event-drop payload.**
  - Moves return the source event, proposed start and end, and explicit source
    and destination day/resource positions.
  - Cross-resource moves retain the concrete destination resource.
  - Moving a clipped segment preserves the source event's full duration.
- [x] **[P0][TG-03] Decouple slot interaction from grid visibility.**
  - Slots remain selectable and valid movement targets regardless of grid-line
    styling.
  - The redundant `showGrid` prop is removed; the interaction layer is always
    mounted and grid-line presentation is owned by CSS.
- [x] **[P0][DATE-01] Replace date-shaped time-of-day inputs.**
  - `minTime` and `maxTime` accept strict wall-clock `HH:mm` values, with
    `24:00` reserved for the exclusive end of a complete day.
  - Layout uses minute offsets instead of artificial reference dates and keeps
    wall-clock rows stable across DST changes.
- [x] **[P1][DATE-02] Normalize every externally supplied selection value.**
  - Selected days and half-open range boundaries accept `CalendarDateInput`,
    are cloned and normalized with the configured time zone, and never mutate
    controlled application state.
  - Invalid boundaries throw contextual `TypeError` messages; empty or
    reversed selection ranges throw `RangeError`.
- [x] **[P1][DATE-03] Define navigation boundary behavior.**
  - `minDate` and `maxDate` are validated inclusive navigation days; partially
    overlapping ranges remain visible while outward navigation is disabled.
  - Controlled anchors outside the interval remain rendered. Movement farther
    outside is disabled, and the first inward request clamps directly to the
    nearest boundary through `onDateChange`.
  - Built-in and range-owned navigation proposals share the same normalization
    and clamping contract across agenda, month, and time-grid views.
- [x] **[P1][RANGE-01] Make range resolution and navigation one coherent
  contract.**
  - `resolveCalendarRange` returns normalized bounds, days, and one
    `navigate(direction)` function instead of discarding navigation metadata.
  - Range definitions use `dayCount` for generated spans, `dates` for explicit
    days, and one nested `navigation` strategy with `stepDays` or
    `resolveAnchor`.
  - Redundant view-level `navigationStep` and `navigateDate` props are removed;
    callback-produced and non-contiguous definitions retain their strategy.
- [x] **[P1][RESOURCE-01] Use stable resource identifier types.**
  - Replace `unknown` resource identifiers with `CalendarResourceId` or a
    constrained generic identifier.
  - Detect missing or duplicate resource identifiers.
  - Document equality and multi-assignment behavior.
- [x] **[P1][SCALE-01] Validate label configuration explicitly.**
  - `labelInterval` must be an integer multiple of `slotDuration`.
  - Invalid configuration throws instead of silently falling back.

## Public API simplification

- [x] **[P0][API-01] Make `CalendarProps` type-safe for built-in views.**
  - Replace `[key: string]: unknown` with a discriminated union keyed by
    `view`.
  - Reject misspelled and unsupported props at compile time.
  - Preserve a typed path for application-defined view registries.
- [x] **[P0][API-02] Use one controlled and uncontrolled configuration path.**
  - Navigation uses `date` and `defaultDate` consistently.
  - `Calendar` keeps shared behavior at its root and selected-view
    configuration under `viewProps`; direct views receive their own props
    directly.
  - Uncontrolled view state is never updated during render.
- [x] **[P0][API-03] Keep one callback for each user action.**
  - Event selection and opening use separate semantic callbacks with one shared
    `(event, interaction, context)` shape.
  - Raw event-root interactions are additive through `eventInteractions` and
    never replace selection or opening behavior.
  - Slot selection uses `onSlotSelect(slot, interaction)`.
  - Callback naming and argument order are consistent across views.
- [x] **[P0][API-04] Make callback presence enable interactions.**
  - `onEventSelect`, `onEventOpen`, `onEventDrop`, and `onEventResize` enable
    only their corresponding behavior without remapping gestures.
  - Optional `canSelectEvent`, `canOpenEvent`, `canDragEvent`, and
    `canResizeEvent` predicates restrict individual occurrences or segments.
- [x] **[P1][API-05] Replace flat renderer props with a `components` contract.**
  - Group event, slot, background, day-header, resource-header, empty-state,
    and navigation renderers by view.
  - Keep only renderer extension points that own meaningful markup.
- [x] **[P1][API-06] Simplify renderer payloads.**
  - Slot renderers should receive a `slot`, selection state, and element props
    instead of fourteen duplicated fields.
  - Event renderers should receive the original event, visible segment,
    selection state, and element props instead of layout fields repeated both
    inside and outside `event`.
  - Time-grid day and resource headers receive their concrete grouping value,
    covered columns, and prepared title without conflating both levels.
- [x] **[P1][API-07] Consolidate remaining visual dimensions.**
  - Slot width and height use one flat `slotSizing` contract with mutually
    exclusive fixed and minimum properties; obsolete cell dimensions and
    nested mode values are removed.
  - Header row height and time-axis width use typed CSS variables; headers and
    slots consume one shared column-track definition so their widths cannot
    conflict.
  - Layout-sensitive variables use deterministic pixel lengths, and one frame
    token owns both the outer border and fixed-width geometry.
  - A typed grid-line width token replaces `showGridLines`.
  - Both `Calendar` and direct view components receive typed `className` and
    `CalendarStyle` props.
- [x] **[P1][API-08] Keep time-grid scale configuration independently overridable.**
  - Flat primitive props avoid configuration-object merge rules and unstable
    object identities when callers override one value.
  - `slotDuration`, `resizeStep`, and `labelInterval` independently own slot
    selection, resize precision, and label cadence.
- [x] **[P1][API-09] Group resource configuration.**
  - Keep resource items and their ID, title, and event-assignment accessors in
    one typed resource contract.
  - Preserve generic inference from the resource items.
- [x] **[P1][API-10] Group formatting and messages.**
  - Complete `formatters` and `messages` registries replace scattered format
    strings, header callbacks, labels, and hardcoded text.
  - Exported immutable English defaults support explicit consumer-side
    extension without hidden partial-object merging.
- [x] **[P1][API-11] Remove the redundant resource preset.**
  - Resource columns are already a capability of every time-grid range.
  - Remove `ResourceView` and the `resource` view name; document resources on
    day, week, and custom time-grid ranges.
- [x] **[P1][API-12] Audit the package export surface.**
  - The root entry exports stable normalization, locale, view, and renderer
    contracts; low-level date/range construction helpers stay internal.
  - Renderer payloads expose semantic dates, intervals, and resource identity;
    generated keys, rows, lanes, and indexes stay inside time-grid layout code.
  - A committed API Extractor report, exact runtime export allowlist, and
    bidirectional docs verification make accidental surface drift fail checks.
- [ ] **[P2][API-13] Accept readonly consumer collections.**
  - Events, background events, resources, selected IDs, and explicit range
    days should accept readonly arrays without requiring copies.
- [x] **[P1][API-14] Make time-grid grouping hierarchy explicit.**
  - Render separate day and resource header levels when resources are present.
  - Allow callers to choose day-first or resource-first column grouping.
  - Omit the resource-header level when no resources are configured.

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
  - One tested policy owns selection, opening, raw interactions, keyboard, and shortcut behavior
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
  - Event selection/opening and resize-handle focus/keyboard behavior are
    documented and tested; complete grid navigation remains open.
  - Add appropriate grid, row, column-header, and grid-cell semantics where
    they improve assistive-technology behavior.
  - Test the behavior with keyboard-only interaction.
- [x] **[P1][A11Y-02] Replace native-only drag and drop.**
  - Independent move controls use one slot-target model for pointer, touch,
    and keyboard input without changing event select/open gestures.
  - Complete proposals preview immediately, announce their date, time, and
    resource, and invoke `onEventDrop` once when committed.
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
  - Selection and opening assertions verify source boundaries and occurrence
    resource data rather than visible layout-segment values.
- [x] **[P0][TEST-02] Test event movement across days and resources.**
  - Unit tests cover duration preservation and cross-resource destinations.
  - Browser stories cover pointer, touch, keyboard, cancelled, and
    cross-resource moves.
- [x] **[P0][TEST-03] Add compile-time public API tests.**
  - Assert accepted prop combinations for every built-in view.
  - Assert that typos, wrong callback payloads, and view-incompatible props
    fail compilation.
- [x] **[P1][TEST-04] Cover view state and navigation contracts.**
  - Controlled and uncontrolled anchor movement is exercised across every
    built-in view.
  - Date and visible-range callbacks assert exact normalized payloads,
    including the month view's month boundaries.
  - Browser coverage verifies min/max disabling and recovery, non-contiguous
    ranges, and custom range-owned navigation.
- [x] **[P1][TEST-05] Cover interaction enablement and renderer contracts.**
  - Callback-presence defaults and event-specific predicates.
  - Selection, opening, resize, and slot interaction with customized renderers.
  - Interaction remains available when grid lines are visually hidden.
- [x] **[P1][TEST-06] Test supported dependency combinations.**
  - The CI compatibility matrix installs matching React and React DOM 18.2
    and 19.0 releases on every supported Node line.
  - Every combination runs unit tests, a production package build, and the
    built package's server-render verification.
- [x] **[P1][TEST-07] Add clean consumer fixtures.**
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

- [x] **[P0][DOC-01] Update documentation with the final pre-release API.**
  - [Getting started](./docs/getting-started.md) and the
    [API reference](./docs/api.md) use the current names and document event
    identity, controlled state, time zones, ranges, resources, renderer
    contracts, and movement payloads with concrete data.
- [x] **[P1][DOC-02] Publish a complete API reference.**
  - The [API reference](./docs/api.md) covers every public export and interface
    property, including callback payloads, defaults, examples, and thrown
    errors. `npm run docs:check` enforces source and GitHub Pages coverage.
- [x] **[P1][DOC-03] Document styling and theming.**
  - [Styling and theming](./docs/styling.md) defines every supported CSS
    variable, stable class hook, responsive behavior, and the ownership
    boundary between library layout and consumer presentation.
- [x] **[P1][DOC-04] Add runnable consumer examples.**
  - The [consumer examples](./examples/) provide independently locked Vite and
    Next.js applications. They cover controlled navigation, resources,
    localization, custom renderers, and interaction state updates and are
    production-built by `npm run examples:check` in CI.
- [x] **[P1][DOC-05] Document accessibility behavior.**
  - [Accessibility](./docs/accessibility.md) documents current keyboard and
    focus behavior, messages, equivalent movement inputs and announcements,
    and custom-renderer responsibilities without claiming open A11Y work is done.
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
- [x] **[P1][REPO-03] Verify the security-reporting path.**
  - Private vulnerability reporting is enabled and `SECURITY.md` links
    directly to the repository's private advisory form.
  - Only npm's `latest` stable release is supported. Confirmed issues use a
    draft advisory and temporary private fork, publish a validated patch from
    `main`, and merge the released fix back into `dev`.
- [ ] **[P2][REPO-04] Track package size.**
  - Record an initial ESM and CSS budget and fail CI on unexplained material
    regressions.
- [ ] **[P2][REPO-05] Define compatibility review for dependency upgrades.**
  - Date-fns, `@date-fns/tz`, React, TypeScript, Vite, and Storybook upgrades
    should include explicit public-API and consumer-fixture verification.

## Product decisions

- [x] **[P1][DEC-01] Include precise time-grid event resizing.**
  - `onEventResize` and `canResizeEvent` cover start/end edges with pointer,
    touch, and keyboard handles independent from event selection/opening.
  - `resizeStep` owns target precision independently from visible slot size;
    movement previews the complete interval immediately.
  - Resizing may cross visible days while retaining the resource.
  - Commit emits one complete proposal; Escape, pointer cancel, and no movement
    emit nothing. Background events remain non-interactive.
- [ ] **[P1][DEC-02] Decide how all-day events appear in time-grid views.**
  - Either define a dedicated all-day region or document that consumers should
    use month/agenda views or a custom renderer.
- [ ] **[P2][DEC-03] Decide the large-resource strategy.**
  - Define practical limits and whether horizontal virtualization, grouped
    resources, or consumer-owned pagination belongs in the library.
