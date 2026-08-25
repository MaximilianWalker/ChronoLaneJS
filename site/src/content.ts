import changelog from "../../CHANGELOG.md?raw";
import accessibility from "../../docs/accessibility.md?raw";
import api from "../../docs/api.md?raw";
import apiCalendarViews from "../../docs/api/calendar-and-views.md?raw";
import apiEventsResourcesRanges from "../../docs/api/events-resources-ranges.md?raw";
import apiInteractionsCallbacks from "../../docs/api/interactions-callbacks.md?raw";
import apiLocalizationUtilities from "../../docs/api/localization-utilities.md?raw";
import apiRendererContracts from "../../docs/api/renderer-contracts.md?raw";
import frameworkIntegration from "../../docs/framework-integration.md?raw";
import gettingStarted from "../../docs/getting-started.md?raw";
import interactions from "../../docs/interactions.md?raw";
import migrationV2 from "../../docs/migrations/v2.md?raw";
import documentation from "../../docs/README.md?raw";
import renderers from "../../docs/renderers.md?raw";
import resources from "../../docs/resources.md?raw";
import styling from "../../docs/styling.md?raw";
import timeZones from "../../docs/time-zones.md?raw";
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
    interactions,
    resources,
    "time-zones": timeZones,
    api,
    "api-calendar-views": apiCalendarViews,
    "api-events-resources-ranges": apiEventsResourcesRanges,
    "api-interactions-callbacks": apiInteractionsCallbacks,
    "api-renderer-contracts": apiRendererContracts,
    "api-localization-utilities": apiLocalizationUtilities,
    styling,
    renderers,
    "framework-integration": frameworkIntegration,
    accessibility,
    "migration-v2": migrationV2,
    changelog,
    overview: readme,
    roadmap,
    security
};

export const documents: readonly DocumentSource[] = documentDefinitions.map((definition) => ({
    ...definition,
    source: normalizeDocumentSource(definition.id, sources[definition.id])
}));

export type { DocumentId } from "./documentManifest.js";
