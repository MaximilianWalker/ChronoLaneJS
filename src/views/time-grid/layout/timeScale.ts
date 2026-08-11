import { addMinutes } from "date-fns/addMinutes";

import { setTime } from "../../../core/date.js";
import type {
    TimeGridColumn,
    TimeGridDivider,
    TimeGridSlot
} from "../types.js";

const wallClockMinutes = (date: Date): number => (
    (date.getHours() * 60)
    + date.getMinutes()
    + (date.getSeconds() / 60)
    + (date.getMilliseconds() / 60_000)
);

export const atDayTime = (day: Date, time: Date): Date => setTime(
    day,
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds()
);

export const getGridRows = (
    start: Date,
    end: Date,
    visibleStart: Date
): { startRow: number; endRow: number } => {
    const firstMinute = Math.floor(wallClockMinutes(visibleStart));

    return {
        startRow: Math.floor(wallClockMinutes(start)) - firstMinute + 1,
        endRow: Math.ceil(wallClockMinutes(end)) - firstMinute + 1
    };
};

interface CreateTimeScaleOptions<Resource> {
    firstDay: Date;
    columns: TimeGridColumn<Resource>[];
    minTime: Date;
    maxTime: Date;
    step: number;
    dividerInterval: number;
}

interface TimeScale<Resource> {
    slots: TimeGridSlot<Resource>[];
    dividers: TimeGridDivider[];
    totalMinutes: number;
    dividerInterval: number;
}

export const createTimeScale = <Resource>({
    firstDay,
    columns,
    minTime,
    maxTime,
    step,
    dividerInterval
}: CreateTimeScaleOptions<Resource>): TimeScale<Resource> => {
    const firstMinute = Math.floor(wallClockMinutes(minTime));
    const lastMinute = Math.ceil(wallClockMinutes(maxTime));
    const totalMinutes = lastMinute - firstMinute;

    if (totalMinutes <= 0) {
        throw new RangeError("Calendar maxTime must be after minTime.");
    }
    if (!Number.isInteger(step) || step < 1) {
        throw new RangeError("Calendar step must be a positive integer.");
    }

    const effectiveDividerInterval = (
        dividerInterval >= step && dividerInterval % step === 0
    ) ? dividerInterval : step;
    const scaleStart = setTime(
        firstDay,
        Math.floor(firstMinute / 60),
        firstMinute % 60
    );
    const slotCount = Math.ceil(totalMinutes / step);
    const dividerCount = Math.ceil(totalMinutes / effectiveDividerInterval);
    const slots = Array.from({ length: slotCount }, (_, timeIndex) => {
        const time = addMinutes(scaleStart, timeIndex * step);

        return columns.map((column, columnIndex) => {
            const start = atDayTime(column.day, time);
            const duration = Math.min(step, totalMinutes - (timeIndex * step));
            const end = addMinutes(start, duration);
            const endMinute = Math.min((timeIndex + 1) * step, totalMinutes);

            return {
                key: `${timeIndex}-${column.key}`,
                start,
                end,
                duration,
                timeIndex,
                day: column.day,
                dayIndex: column.dayIndex,
                columnIndex,
                resource: column.resource,
                isDividerBoundary: endMinute !== totalMinutes
                    && endMinute % effectiveDividerInterval === 0
            };
        });
    }).flat();
    const dividers = Array.from({ length: dividerCount }, (_, index) => ({
        key: `${scaleStart.getTime()}-${index}`,
        time: addMinutes(scaleStart, index * effectiveDividerInterval),
        startRow: (index * effectiveDividerInterval) + 1,
        rowSpan: Math.min(
            effectiveDividerInterval,
            totalMinutes - (index * effectiveDividerInterval)
        )
    }));

    return {
        slots,
        dividers,
        totalMinutes,
        dividerInterval: effectiveDividerInterval
    };
};
