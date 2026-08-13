import type { ComponentType, MouseEventHandler, ReactNode } from "react";

import type { CalendarNavigationButtonProps } from "../types.js";

/**
 * Renders the default previous or next navigation control.
 *
 * Consumers can replace this renderer through `components.navigation`.
 */
export const DefaultNavigationButton = ({
    type,
    children,
    ...props
}: CalendarNavigationButtonProps) => (
    <button type="button" {...props}>
        {children ?? (
            <svg
                className="calendar-view_navigation-icon"
                viewBox="0 0 20 20"
                aria-hidden="true"
                focusable="false"
            >
                <path d={type === "prev" ? "m12.5 5-5 5 5 5" : "m7.5 5 5 5-5 5"} />
            </svg>
        )}
    </button>
);

interface CalendarNavigationProps {
    header: ReactNode;
    onPrevious: MouseEventHandler<HTMLButtonElement>;
    onNext: MouseEventHandler<HTMLButtonElement>;
    previousDisabled?: boolean;
    nextDisabled?: boolean;
    previousLabel: string;
    nextLabel: string;
    navigation?: ComponentType<CalendarNavigationButtonProps>;
    className?: string;
}

/**
 * Renders the shared range header with previous and next controls.
 *
 * Disabled directions remain in the layout but are hidden to keep the header
 * centered and prevent unavailable navigation.
 */
export default function CalendarNavigation({
    header,
    onPrevious,
    onNext,
    previousDisabled = false,
    nextDisabled = false,
    previousLabel,
    nextLabel,
    navigation: NavigationButton = DefaultNavigationButton,
    className = ""
}: CalendarNavigationProps) {
    return (
        <div className={`calendar-view_navigation ${className}`.trim()}>
            <NavigationButton
                type="prev"
                aria-label={previousLabel}
                aria-hidden={previousDisabled || undefined}
                className="calendar-view_navigation-button"
                disabled={previousDisabled}
                onClick={previousDisabled ? undefined : onPrevious}
                style={{ visibility: previousDisabled ? "hidden" : "visible" }}
            />
            <h2 className="calendar-view_navigation-text">{header}</h2>
            <NavigationButton
                type="next"
                aria-label={nextLabel}
                aria-hidden={nextDisabled || undefined}
                className="calendar-view_navigation-button"
                disabled={nextDisabled}
                onClick={nextDisabled ? undefined : onNext}
                style={{ visibility: nextDisabled ? "hidden" : "visible" }}
            />
        </div>
    );
}
