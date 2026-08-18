export type TimeGridNavigationKey =
    | "ArrowDown"
    | "ArrowLeft"
    | "ArrowRight"
    | "ArrowUp"
    | "End"
    | "Home"
    | "PageDown"
    | "PageUp";

interface TimeGridNavigationOptions {
    currentIndex: number;
    itemCount: number;
    columnCount: number;
    pageRowCount: number;
    controlKey: boolean;
}

const navigationKeys = new Set<string>([
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "End",
    "Home",
    "PageDown",
    "PageUp"
]);

/** Identifies keys owned by time-grid slot navigation. */
export const isTimeGridNavigationKey = (
    key: string
): key is TimeGridNavigationKey => navigationKeys.has(key);

/** Resolves the row-major slot index targeted by one grid navigation key. */
export const getTimeGridNavigationTarget = ({
    currentIndex,
    itemCount,
    columnCount,
    pageRowCount,
    controlKey
}: TimeGridNavigationOptions, key: TimeGridNavigationKey): number | undefined => {
    if (
        itemCount < 1
        || columnCount < 1
        || currentIndex < 0
        || currentIndex >= itemCount
    ) return undefined;

    const columnIndex = currentIndex % columnCount;
    const rowStart = currentIndex - columnIndex;
    const rowEnd = Math.min(itemCount - 1, rowStart + columnCount - 1);

    if (controlKey) {
        if (key === "Home") return 0;
        if (key === "End") return itemCount - 1;
        return undefined;
    }

    if (key === "Home") return rowStart;
    if (key === "End") return rowEnd;
    if (key === "ArrowLeft") {
        return columnIndex === 0 ? currentIndex : currentIndex - 1;
    }
    if (key === "ArrowRight") {
        return currentIndex === rowEnd ? currentIndex : currentIndex + 1;
    }
    if (key === "ArrowUp") {
        return Math.max(columnIndex, currentIndex - columnCount);
    }
    if (key === "ArrowDown") {
        return Math.min(
            itemCount - columnCount + columnIndex,
            currentIndex + columnCount
        );
    }

    const pageOffset = Math.max(1, pageRowCount) * columnCount;
    if (key === "PageUp") {
        return Math.max(columnIndex, currentIndex - pageOffset);
    }

    return Math.min(
        itemCount - columnCount + columnIndex,
        currentIndex + pageOffset
    );
};
