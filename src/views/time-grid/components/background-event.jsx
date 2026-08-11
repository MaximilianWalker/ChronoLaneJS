export default function TimeGridBackgroundEvent({ className, event, style }) {
    return (
        <div
            aria-hidden="true"
            className={className}
            data-background-event-id={event.id}
            style={style}
        />
    );
}
