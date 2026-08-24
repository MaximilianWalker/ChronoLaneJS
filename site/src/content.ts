import changelog from "../../CHANGELOG.md?raw";
import development from "../../DEVELOPMENT.md?raw";
import accessibility from "../../docs/accessibility.md?raw";
import api from "../../docs/api.md?raw";
import examples from "../../docs/examples.md?raw";
import gettingStarted from "../../docs/getting-started.md?raw";
import migrationV2 from "../../docs/migrations/v2.md?raw";
import documentation from "../../docs/README.md?raw";
import styling from "../../docs/styling.md?raw";
import readme from "../../README.md?raw";
import roadmap from "../../ROADMAP.md?raw";
import security from "../../SECURITY.md?raw";

import {
    documentDefinitions,
    normalizeDocumentSource,
    type DocumentDefinition,
    type DocumentId
} from "./documentManifest.js";

export interface DocumentSource extends DocumentDefinition {
    source: string;
}

const sources: Record<DocumentId, string> = {
    documentation,
    "getting-started": gettingStarted,
    api,
    styling,
    examples,
    accessibility,
    "migration-v2": migrationV2,
    changelog,
    overview: readme,
    development,
    roadmap,
    security
};

export const documents: readonly DocumentSource[] = documentDefinitions.map((definition) => ({
    ...definition,
    source: normalizeDocumentSource(definition.id, sources[definition.id])
}));

export type { DocumentId } from "./documentManifest.js";
