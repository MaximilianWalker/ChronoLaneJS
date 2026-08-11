export default function TimeGridSlot({
    className,
    onClick,
    onDragOver,
    onDrop,
    style,
    "aria-label": ariaLabel
}) {
    const Component = onClick ? "button" : "div";

    return (
        <Component
            type={onClick ? "button" : undefined}
            aria-label={onClick ? ariaLabel : undefined}
            className={className}
            onClick={onClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={style}
        />
    );
}
