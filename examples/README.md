# Consumer examples

These applications validate ChronoLaneJS from the consumer side. Each has its
own lockfile and consumes the repository root through `file:../..`.

| Application | Coverage | Commands |
| --- | --- | --- |
| [Vite](./vite/) | Controlled navigation, resources, localization, custom rendering, selection, editing, slot selection, and event-drop state updates | `npm install --prefix examples/vite` then `npm run dev --prefix examples/vite` |
| [Next.js](./next/) | App Router CSS ownership, client boundaries, controlled navigation, and selection state | `npm install --prefix examples/next` then `npm run dev --prefix examples/next` |

Build the package before starting either application:

```bash
npm run build
```

Run both production consumer builds with:

```bash
npm run examples:check
```

The canonical explanations and excerpts are in the
[examples guide](../docs/examples.md), which is also published on the GitHub
Pages documentation site.
