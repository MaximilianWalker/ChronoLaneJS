import TimeGridView from "../view.jsx";

export default function ResourceView({
    range = "day",
    navigationStep = 1,
    previousLabel = "Previous resource range",
    nextLabel = "Next resource range",
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
