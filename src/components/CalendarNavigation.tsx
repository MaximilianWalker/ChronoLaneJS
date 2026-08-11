import type { ComponentType, MouseEventHandler, ReactNode } from "react";

import type { CalendarNavigationButtonProps } from "../types.js";

export const DefaultNavigationButton = ({
    type,
    children,
    ...props
}: CalendarNavigationButtonProps) => (
    <button type="button" {...props}>
        {children ?? (type === "prev" ? "<" : ">")}
    </button>
);

interface CalendarNavigationProps {
    header: ReactNode;
    onPrevious: MouseEventHandler<HTMLButtonElement>;
    onNext: MouseEventHandler<HTMLButtonElement>;
    previousDisabled?: boolean;
    nextDisabled?: boolean;
    previousLabel?: string;
    nextLabel?: string;
    navigationButton?: ComponentType<CalendarNavigationButtonProps>;
    className?: string;
}

export default function CalendarNavigation({
    header,
    onPrevious,
    onNext,
    previousDisabled = false,
    nextDisabled = false,
    previousLabel = "Previous range",
    nextLabel = "Next range",
    navigationButton: NavigationButton = DefaultNavigationButton,
    className = ""
}: CalendarNavigationProps) {
    return (
        <div className={`calendar-view_navigation ${className}`.trim()}>
            <NavigationButton
                type="prev"
                aria-label={previousLabel}
                className="calendar-view_navigation-button"
                onClick={onPrevious}
                style={{ visibility: previousDisabled ? "hidden" : "visible" }}
            />
            <h2 className="calendar-view_navigation-text">{header}</h2>
            <NavigationButton
                type="next"
                aria-label={nextLabel}
                className="calendar-view_navigation-button"
                onClick={onNext}
                style={{ visibility: nextDisabled ? "hidden" : "visible" }}
            />
        </div>
    );
}
