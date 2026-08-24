const DRAG_THRESHOLD = 4;

const suppressedClicks = new WeakSet<HTMLElement>();

interface PointerCoordinates {
    clientX: number;
    clientY: number;
}

export const exceedsDragThreshold = (
    origin: PointerCoordinates,
    current: PointerCoordinates
): boolean => Math.hypot(
    current.clientX - origin.clientX,
    current.clientY - origin.clientY
) >= DRAG_THRESHOLD;

export const suppressNextClick = (element: HTMLElement): void => {
    suppressedClicks.add(element);
    setTimeout(() => suppressedClicks.delete(element), 0);
};

export const consumeSuppressedClick = (element: HTMLElement): boolean => {
    if (!suppressedClicks.has(element)) return false;

    suppressedClicks.delete(element);
    return true;
};
