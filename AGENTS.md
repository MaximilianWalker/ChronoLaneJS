# ChronoLaneJS agent instructions

This project follows the parent/global `AGENTS.md` loaded by the agent. Only
project-specific constraints are defined here.

## React component boundaries

- Follow the component-boundary rules in `DEVELOPMENT.md`.
- Never introduce a same-file pass-through component solely to shorten a
  parent component or move its JSX.
- Treat a long list of parent-owned props as evidence that the proposed child
  does not own a real boundary. Inline it or first design a cohesive model,
  hook, or feature module with a materially smaller contract.
- Extract components only for reusable UI, independent behavior or lifecycle,
  an intentional performance boundary, or a public renderer extension point.
- Do not stack multiple private component abstractions around the same domain
  noun; keep one clear owner and name injected renderers explicitly.
- Do not use broad prop/config objects to disguise an incohesive component
  boundary or a long list of parent-owned dependencies.
- Keep pure, independently testable calculations in focused domain modules;
  do not create miscellaneous helper or utility files.
- Remove obsolete boundaries and all references atomically. Do not retain
  aliases or compatibility wrappers unless the user explicitly requires them.

## React render readability

- Follow the render-structure and interaction-ownership rules in
  `DEVELOPMENT.md`.
- Keep render bodies as semantic composition. Do not declare non-trivial event
  handlers, perform layout calculations, or embed branching collection
  transforms inside JSX callbacks.
- Keep one occurrence owner between a collection and an injected renderer.
  That owner may own cohesive pointer, keyboard, selection, and resize
  behavior; do not wrap it in additional same-domain component layers.
- Keep traversal of purely structural collection hierarchies in their
  collection owner until a genuine occurrence owner or injected renderer.
  Do not extract generic row, cell, or item components merely to continue
  mapping, wrap styled elements, or conceal collection-owned behavior.
- Keep time-grid row and cell iteration, structure, selection/navigation
  wiring, and slot-renderer invocation in `Slots`. Prepare complex behavior in
  a focused model or hook instead of private `Row` or `Cell` components.
- Extract structural components only when they own concrete layout,
  accessibility, navigation, or interaction semantics.
- Split hooks when their concerns can change independently. Compose focused
  hooks in one feature controller instead of accumulating unrelated behavior
  in a single large hook.

## Comment discipline

- Follow the documentation and comment rules in `DEVELOPMENT.md`.
- Do not introduce isolated explanatory comments where naming and structure
  already make the code clear.

## Feature-local naming

- Follow the feature-local naming rule in `DEVELOPMENT.md`.
- Do not repeat a containing feature-folder name in private files or symbols.
- Apply the domain prefix at the boundary that exports a symbol outside its
  feature folder.
