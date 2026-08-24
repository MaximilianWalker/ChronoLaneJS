import type { ComponentType } from "react";

import type {
    HeaderModel,
    HeaderOccurrence
} from "./headerModel.js";
import type {
    DayHeaderProps,
    ResourceHeaderProps
} from "./types.js";

interface HeaderGroupProps<Resource> {
    occurrence: HeaderOccurrence<Resource>;
    dayHeaderRenderer: ComponentType<DayHeaderProps<Resource>>;
    resourceHeaderRenderer: ComponentType<ResourceHeaderProps<Resource>>;
}

function HeaderGroup<Resource>({
    occurrence,
    dayHeaderRenderer: DayHeaderRenderer,
    resourceHeaderRenderer: ResourceHeaderRenderer
}: HeaderGroupProps<Resource>) {
    const content = occurrence.kind === "day"
        ? <DayHeaderRenderer {...occurrence.rendererProps} />
        : <ResourceHeaderRenderer {...occurrence.rendererProps} />;

    return (
        <div className={occurrence.className} style={occurrence.style}>
            {content}
        </div>
    );
}

interface HeaderProps<Resource> {
    model: HeaderModel<Resource>;
    dayHeaderRenderer: ComponentType<DayHeaderProps<Resource>>;
    resourceHeaderRenderer: ComponentType<ResourceHeaderProps<Resource>>;
}

export default function Header<Resource>({
    model,
    dayHeaderRenderer,
    resourceHeaderRenderer
}: HeaderProps<Resource>) {
    return (
        <div className={model.className}>
            {model.occurrences.map((occurrence) => (
                <HeaderGroup
                    key={occurrence.key}
                    occurrence={occurrence}
                    dayHeaderRenderer={dayHeaderRenderer}
                    resourceHeaderRenderer={resourceHeaderRenderer}
                />
            ))}
        </div>
    );
}
