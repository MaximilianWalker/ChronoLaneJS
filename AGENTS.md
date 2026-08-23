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

## Comment discipline

- Follow the documentation and comment rules in `DEVELOPMENT.md`.
- Do not introduce isolated explanatory comments where naming and structure
  already make the code clear.

## Feature-local naming

- Follow the feature-local naming rule in `DEVELOPMENT.md`.
- Do not repeat a containing feature-folder name in private files or symbols.
- Apply the domain prefix at the boundary that exports a symbol outside its
  feature folder.
