import { format } from "date-fns/format";

import type { ViewText } from "../../components/eventPresentation.js";
import type { LayoutDivider } from "./layout/types.js";

interface TimeLabelsProps {
    dividers: LayoutDivider[];
    rowTemplate: string;
    height?: string;
    minHeight?: string;
    text: ViewText;
}

export default function TimeLabels({
    dividers,
    rowTemplate,
    height,
    minHeight,
    text
}: TimeLabelsProps) {
    return (
        <div
            className="time-grid-view_time-labels"
            style={{
                gridTemplateRows: rowTemplate,
                height,
                minHeight
            }}
        >
            {dividers.map(({ key, time, startRow, rowSpan }) => (
                <div
                    key={key}
                    className="time-grid-view_time-label"
                    style={{ gridRow: `${startRow} / span ${rowSpan}` }}
                >
                    <time dateTime={format(time, "HH:mm")}>
                        {text.formatters.time(time, text.context)}
                    </time>
                </div>
            ))}
        </div>
    );
}
