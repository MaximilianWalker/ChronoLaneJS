import TimeGridView from "../view.jsx";

export default function WeekView({
    range = "week",
    navigationStep = 7,
    previousLabel = "Previous week",
    nextLabel = "Next week",
    ...props
}) {
    return (
        <TimeGridView
            {...props}
            range={range}
            navigationStep={navigationStep}
            previousLabel={previousLabel}
            nextLabel={nextLabel}
        />
    );
}
