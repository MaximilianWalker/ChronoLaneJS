import TimeGridView from "../view.jsx";

export default function DayView({
    range = "day",
    navigationStep = 1,
    dayFormat = "EEEE, MMMM do",
    headerFormat = "MMMM do, yyyy",
    previousLabel = "Previous day",
    nextLabel = "Next day",
    ...props
}) {
    return (
        <TimeGridView
            {...props}
            range={range}
            navigationStep={navigationStep}
            dayFormat={dayFormat}
            headerFormat={headerFormat}
            previousLabel={previousLabel}
            nextLabel={nextLabel}
        />
    );
}
