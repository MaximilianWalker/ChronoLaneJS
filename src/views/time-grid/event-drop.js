import { addMilliseconds } from "date-fns";

export const moveTimeGridEvent = (event, start) => {
    const originalStart = event.originalStart ?? event.start;
    const originalEnd = event.originalEnd ?? event.end;
    const duration = originalEnd.getTime() - originalStart.getTime();

    return {
        ...event,
        start,
        end: addMilliseconds(start, duration)
    };
};
