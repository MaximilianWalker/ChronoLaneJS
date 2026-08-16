# Consumer examples

These applications validate ChronoLaneJS from the consumer side. Each has its
own lockfile and uses `file:../..` for local development.

| Application | Coverage | Commands |
| --- | --- | --- |
| [Vite](./vite/) | Controlled navigation, resources, localization, custom rendering, selection, editing, slot selection, and event-drop state updates | `npm install --prefix examples/vite` then `npm run dev --prefix examples/vite` |
| [Next.js](./next/) | App Router CSS ownership, client boundaries, controlled navigation, and selection state | `npm install --prefix examples/next` then `npm run dev --prefix examples/next` |

Build the package before starting either application:

```bash
npm run build
```

Run the packed-artifact verification with:

```bash
npm run examples:check
```

The check creates one npm tarball, installs that exact artifact into temporary
clean copies of both applications, and verifies package metadata, runtime
exports, declarations, CSS, the client directive, lazy locales, server
rendering, and tree shaking before production-building Vite and Next.js.

The canonical explanations and excerpts are in the
[examples guide](../docs/examples.md), which is also published on the GitHub
Pages documentation site.
