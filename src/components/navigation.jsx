export const DefaultNavigationButton = ({ type, children, ...props }) => (
    <button type="button" {...props}>
        {children ?? (type === "prev" ? "<" : ">")}
    </button>
);

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
}) {
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
import "./navigation.css";
